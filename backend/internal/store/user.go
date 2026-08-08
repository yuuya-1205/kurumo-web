// Package store はデータベースへの読み書きを担う。
//
// GORM 固有のエラーはここで自前の sentinel error に変換する。
// 上位層（handler）が GORM に依存しないようにするため。
package store

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/yuuya-1205/kurumo-web/backend/internal/model"
)

var (
	// ErrNotFound は対象のレコードが存在しない。
	ErrNotFound = errors.New("record not found")
	// ErrEmailTaken は同じメールアドレスが既に登録されている。
	ErrEmailTaken = errors.New("email already taken")
)

// User はユーザーの永続化を担う。
type User struct {
	db *gorm.DB
}

// NewUser は User を生成する。
func NewUser(db *gorm.DB) *User {
	return &User{db: db}
}

// List は全ユーザーを ID 昇順で返す。
func (s *User) List(ctx context.Context) ([]model.User, error) {
	users := []model.User{}
	if err := s.db.WithContext(ctx).Order("id").Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

// Get は ID でユーザーを 1 件返す。存在しない場合は ErrNotFound。
func (s *User) Get(ctx context.Context, id uint64) (*model.User, error) {
	var user model.User
	if err := s.db.WithContext(ctx).First(&user, id).Error; err != nil {
		return nil, translate(err)
	}
	return &user, nil
}

// Create はユーザーを登録する。メールアドレスが重複する場合は ErrEmailTaken。
func (s *User) Create(ctx context.Context, user *model.User) error {
	if err := s.db.WithContext(ctx).Create(user).Error; err != nil {
		return translate(err)
	}
	return nil
}

// Update は ID のユーザーの name と email を更新する。
// 存在しない場合は ErrNotFound、メールアドレスが重複する場合は ErrEmailTaken。
func (s *User) Update(ctx context.Context, id uint64, name, email string) (*model.User, error) {
	user, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	user.Name = name
	user.Email = email

	if err := s.db.WithContext(ctx).Save(user).Error; err != nil {
		return nil, translate(err)
	}
	return user, nil
}

// Delete は ID のユーザーを論理削除する。存在しない場合は ErrNotFound。
func (s *User) Delete(ctx context.Context, id uint64) error {
	res := s.db.WithContext(ctx).Delete(&model.User{}, id)
	if res.Error != nil {
		return translate(res.Error)
	}
	// Delete は対象が無くてもエラーにならないため、件数で判定する。
	if res.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// translate は GORM のエラーを store の sentinel error に変換する。
func translate(err error) error {
	switch {
	case errors.Is(err, gorm.ErrRecordNotFound):
		return ErrNotFound
	case errors.Is(err, gorm.ErrDuplicatedKey):
		return ErrEmailTaken
	default:
		return err
	}
}
