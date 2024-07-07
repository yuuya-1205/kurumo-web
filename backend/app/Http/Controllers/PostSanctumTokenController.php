<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PostSanctumTokenController extends Controller
{
    public const TOKEN_NAME = 'app_api_token';
    public function __invoke(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                    'message' => 'no user'
            ]);
        }

        return response()->json([
            'accessToken' => $user->createToken(self::TOKEN_NAME)->plainTextToken
        ]);
    }
}
