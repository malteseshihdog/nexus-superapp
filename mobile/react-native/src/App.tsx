import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import RootNavigator from './navigation/RootNavigator';
import { registerAuthInterceptor, registerErrorInterceptor, registerLoggingInterceptor } from '../../shared/src/api/interceptors';

registerAuthInterceptor();
registerLoggingInterceptor();
registerErrorInterceptor();

export default function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
