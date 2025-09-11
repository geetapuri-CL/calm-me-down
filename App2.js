import React, { useState } from 'react';
import { Button, Text, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import qs from 'qs';

const CLIENT_ID = '23QLP5';  // replace with your CMD Fitbit app client ID
const SCOPES = ['heartrate', 'activity', 'profile', 'sleep'];

const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
console.log(redirectUri);

const getFitbitAuthUrl = () => {
  const baseUrl = 'https://www.fitbit.com/oauth2/authorize';
  const queryParams = qs.stringify({
    client_id: CLIENT_ID,
    response_type: 'token',
    scope: SCOPES.join(' '),
    redirect_uri: redirectUri,
    expires_in: '31536000',
  });
  return `${baseUrl}?${queryParams}`;
};

export default function App() {
  const [token, setToken] = useState(null);

  const handleAuth = async () => {
    const authUrl = getFitbitAuthUrl();
    const result = await AuthSession.startAsync({ authUrl });
    if (result.type === 'success') {
      setToken(result.params.access_token);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {token ? (
        <Text>Access Token: {token}</Text>
      ) : (
        <Button title="Authorize Fitbit" onPress={handleAuth} />
      )}
    </View>
  );
}
