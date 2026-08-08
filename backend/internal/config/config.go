package config

import (
	"os"
	"strconv"
	"time"
)

// Config はサーバー起動に必要な設定を保持する。
type Config struct {
	Port            string
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	ShutdownTimeout time.Duration
}

// Load は環境変数から設定を読み込む。未設定の項目は既定値を使う。
func Load() Config {
	return Config{
		Port:            getEnv("PORT", "8080"),
		ReadTimeout:     getEnvDuration("READ_TIMEOUT_SEC", 10*time.Second),
		WriteTimeout:    getEnvDuration("WRITE_TIMEOUT_SEC", 10*time.Second),
		ShutdownTimeout: getEnvDuration("SHUTDOWN_TIMEOUT_SEC", 15*time.Second),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	sec, err := strconv.Atoi(v)
	if err != nil || sec <= 0 {
		return fallback
	}
	return time.Duration(sec) * time.Second
}
