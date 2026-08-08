// Package db は MySQL への接続を扱う。
package db

import (
	"context"
	"database/sql"
	"fmt"
	"net"
	"time"

	"github.com/go-sql-driver/mysql"
	gormmysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/yuuya-1205/kurumo-web/backend/internal/config"
)

// Open は接続プールを構築する。
//
// この時点では実際の接続を張らないため、DB が起動していなくてもエラーには
// ならない。疎通確認は Ping で行う。
func Open(cfg config.DBConfig) (*gorm.DB, error) {
	c := mysql.NewConfig()
	c.Net = "tcp"
	c.Addr = net.JoinHostPort(cfg.Host, cfg.Port)
	c.User = cfg.User
	c.Passwd = cfg.Password
	c.DBName = cfg.Name
	c.ParseTime = true // DATETIME / TIMESTAMP を time.Time で受け取る
	c.Loc = time.UTC
	c.InterpolateParams = true

	gdb, err := gorm.Open(gormmysql.Open(c.FormatDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel(cfg.LogLevel)),
		// gorm.ErrDuplicatedKey などに変換させる。ドライバ固有の
		// エラー番号（1062 など）を上位層で判定せずに済む。
		TranslateError: true,
		// CreatedAt / UpdatedAt の生成方法を揃える。既定の time.Now() は
		// ローカル時刻かつナノ秒精度で、そのままだと作成直後のレスポンスが
		// +09:00・マイクロ秒、DB から読み戻すと Z・ミリ秒となり、同じ時刻が
		// 別の値として見えてしまう。
		//
		// UTC に統一し、カラムの精度（datetime(3)）に合わせて切り捨てる。
		// これで作成レスポンスと保存値が必ず一致する。
		NowFunc: func() time.Time {
			return time.Now().UTC().Truncate(time.Millisecond)
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open gorm: %w", err)
	}

	pool, err := gdb.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}
	pool.SetMaxOpenConns(cfg.MaxOpenConns)
	pool.SetMaxIdleConns(cfg.MaxIdleConns)
	pool.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	return gdb, nil
}

// Ping は指定時間内に疎通確認を行う。
func Ping(ctx context.Context, gdb *gorm.DB, timeout time.Duration) error {
	pool, err := gdb.DB()
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	return pool.PingContext(ctx)
}

// Stats は接続プールの統計を返す。
func Stats(gdb *gorm.DB) (sql.DBStats, error) {
	pool, err := gdb.DB()
	if err != nil {
		return sql.DBStats{}, err
	}
	return pool.Stats(), nil
}

// Close は接続プールを閉じる。
func Close(gdb *gorm.DB) error {
	pool, err := gdb.DB()
	if err != nil {
		return err
	}
	return pool.Close()
}

func logLevel(name string) logger.LogLevel {
	switch name {
	case "silent":
		return logger.Silent
	case "error":
		return logger.Error
	case "info":
		return logger.Info
	default:
		return logger.Warn
	}
}
