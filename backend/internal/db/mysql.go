// Package db は MySQL への接続を扱う。
package db

import (
	"context"
	"database/sql"
	"fmt"
	"net"
	"time"

	"github.com/go-sql-driver/mysql"

	"github.com/yuuya-1205/kurumo-web/backend/internal/config"
)

// Open は接続プールを構築する。
//
// sql.Open は実際の接続を張らないため、この時点では DB が起動していなくても
// エラーにはならない。疎通確認は Ping / PingContext で行う。
func Open(cfg config.DBConfig) (*sql.DB, error) {
	c := mysql.NewConfig()
	c.Net = "tcp"
	c.Addr = net.JoinHostPort(cfg.Host, cfg.Port)
	c.User = cfg.User
	c.Passwd = cfg.Password
	c.DBName = cfg.Name
	c.ParseTime = true // DATETIME / TIMESTAMP を time.Time で受け取る
	c.Loc = time.UTC
	c.InterpolateParams = true

	conn, err := mysql.NewConnector(c)
	if err != nil {
		return nil, fmt.Errorf("failed to build mysql connector: %w", err)
	}

	pool := sql.OpenDB(conn)
	pool.SetMaxOpenConns(cfg.MaxOpenConns)
	pool.SetMaxIdleConns(cfg.MaxIdleConns)
	pool.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	return pool, nil
}

// Ping は指定時間内に疎通確認を行う。
func Ping(ctx context.Context, pool *sql.DB, timeout time.Duration) error {
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	return pool.PingContext(ctx)
}
