<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserControler extends Controller
{
       //3. ユーザデータを保存
       $userService = new UserService();
       $userService->create($request);

       $tokenService = new TokenService();
       $tokenService->create($request);
}
