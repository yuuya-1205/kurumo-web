// Package model はデータベースのテーブルに対応する構造体を定義する。
package model

import (
	"time"

	"gorm.io/gorm"
)

// User はユーザー。
//
// DeletedAt を持たせているため削除は論理削除になる。通常のクエリからは
// 自動的に除外され、物理削除したい場合は Unscoped().Delete を使う。
type User struct {
	ID        uint64         `gorm:"primaryKey"                       json:"id"`
	Name      string         `gorm:"size:100;not null"                json:"name"`
	Email     string         `gorm:"size:255;not null;uniqueIndex"    json:"email"`
	CreatedAt time.Time      `                                        json:"created_at"`
	UpdatedAt time.Time      `                                        json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"                            json:"-"`
}
