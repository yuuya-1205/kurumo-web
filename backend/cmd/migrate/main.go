// マイグレーションを適用するコマンド。
//
// サーバー起動時には走らせず、明示的に実行する形にしている。
// 本番で意図しないスキーマ変更が起きるのを防ぐため。
//
//	make migrate
//
// AutoMigrate はテーブルとカラムの「追加」しか行わない。カラムの削除や
// リネームは反映されないため、そうした変更が必要になった時点で
// goose などのマイグレーションツールへ移行すること。
package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	"github.com/yuuya-1205/kurumo-web/backend/internal/config"
	"github.com/yuuya-1205/kurumo-web/backend/internal/db"
	"github.com/yuuya-1205/kurumo-web/backend/internal/model"
)

const pingTimeout = 5 * time.Second

func main() {
	if err := run(); err != nil {
		slog.Error("migration failed", "error", err)
		os.Exit(1)
	}
}

func run() error {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	cfg := config.Load()

	gdb, err := db.Open(cfg.DB)
	if err != nil {
		return err
	}
	defer db.Close(gdb)

	// マイグレーションは DB に繋がらなければ意味がないので、ここでは失敗させる。
	if err := db.Ping(context.Background(), gdb, pingTimeout); err != nil {
		return err
	}

	slog.Info("running migration", "database", cfg.DB.Name)

	if err := gdb.AutoMigrate(&model.User{}); err != nil {
		return err
	}

	slog.Info("migration completed")
	return nil
}
