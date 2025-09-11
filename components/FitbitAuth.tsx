import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import { Button, Text, View } from 'react-native';

const CLIENT_ID = '23QLP5';
const CLIENT_SECRET = 'e0c4f9230a61bc49cea80071b8d45a45'; // You need to add your client secret here
const SCOPES = ['heartrate', 'activity', 'profile', 'sleep', 'weight', 'nutrition', 'settings'];
const DISCOVERY = {
  authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
  tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
};
const ACCESS_TOKEN_KEY = 'fitbitAccessToken';
const REFRESH_TOKEN_KEY = 'fitbitRefreshToken';
const TOKEN_EXPIRY_KEY = 'fitbitTokenExpiry';

export function FitbitAuth({ onTokenChange }: { onTokenChange: (token: string | null) => void }) {
  const [token, setToken] = useState<string | null>(null);
  const redirectUri = AuthSession.makeRedirectUri();

  const config = {
    clientId: CLIENT_ID,
    scopes: SCOPES,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(config, DISCOVERY);

  // Function to refresh access token
  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const response = await fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
      });

      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token;
        const expiresIn = data.expires_in;
        const expiryTime = Date.now() + (expiresIn * 1000);

        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

        setToken(newAccessToken);
        onTokenChange(newAccessToken);
        return newAccessToken;
      } else {
        console.error('Token refresh failed:', await response.text());
        await logout();
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      return null;
    }
  };

  // Check if token is expired and refresh if needed
  const checkAndRefreshToken = async () => {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    const expiryTime = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);

    if (!accessToken || !refreshToken || !expiryTime) {
      return null;
    }

    if (Date.now() >= parseInt(expiryTime)) {
      console.log('Token expired, refreshing...');
      return await refreshAccessToken(refreshToken);
    }

    return accessToken;
  };

  useEffect(() => {
    (async () => {
      const validToken = await checkAndRefreshToken();
      if (validToken) {
        setToken(validToken);
        onTokenChange(validToken);
      } else {
        onTokenChange(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      // Exchange authorization code for tokens
      (async () => {
        try {
          const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
            },
            body: `grant_type=authorization_code&code=${response.params.code}&redirect_uri=${encodeURIComponent(redirectUri)}&code_verifier=${request?.codeVerifier}`,
          });

          if (tokenResponse.ok) {
            const data = await tokenResponse.json();
            const accessToken = data.access_token;
            const refreshToken = data.refresh_token;
            const expiresIn = data.expires_in;
            const expiryTime = Date.now() + (expiresIn * 1000);

            await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
            await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

            setToken(accessToken);
            onTokenChange(accessToken);
          } else {
            console.error('Token exchange failed:', await tokenResponse.text());
          }
        } catch (error) {
          console.error('Token exchange error:', error);
        }
      })();
    }
  }, [response, redirectUri, request]);

  const logout = async () => {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(TOKEN_EXPIRY_KEY);
    setToken(null);
    onTokenChange(null);
  };

  return (
    <View style={{ marginVertical: 20 }}>
      {token ? (
        <>
          <Text style={{ marginBottom: 10, color: 'white' }}>Logged in to Fitbit</Text>
          <Button title="Logout" onPress={logout} />
        </>
      ) : (
        <Button disabled={!request} title="Authorize Fitbit" onPress={() => promptAsync()} />
      )}
    </View>
  );
}
