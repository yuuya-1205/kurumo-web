package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/yuuya-1205/kurumo-web/backend/internal/config"
	"github.com/yuuya-1205/kurumo-web/backend/internal/db"
	"github.com/yuuya-1205/kurumo-web/backend/internal/server"
)

// dbStartupPingTimeout は起動時の疎通確認の上限。
const dbStartupPingTimeout = 5 * time.Second

func main() {
	if err := run(); err != nil {
		slog.Error("server terminated", "error", err)
		os.Exit(1)
	}
}

func run() error {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	cfg := config.Load()

	// JWT_SECRET が無いまま起動させない。既定の署名鍵があると、
	// 誰でも任意のユーザーになりすませるトークンを作れてしまうため。
	if err := cfg.Validate(); err != nil {
		return err
	}

	gdb, err := db.Open(cfg.DB)
	if err != nil {
		return err
	}
	defer db.Close(gdb)

	// DB が落ちていてもサーバー自体は起動させ、状態は /healthz/db で報告する。
	if err := db.Ping(context.Background(), gdb, dbStartupPingTimeout); err != nil {
		slog.Warn("database unreachable at startup", "error", err)
	} else {
		slog.Info("database connected", "database", cfg.DB.Name)
	}

	srv := server.New(cfg, gdb)

	// SIGINT / SIGTERM を受けたら graceful shutdown する。
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		slog.Info("server listening", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
		slog.Info("shutdown signal received")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		return err
	}

	slog.Info("server stopped")
	return nil
}
