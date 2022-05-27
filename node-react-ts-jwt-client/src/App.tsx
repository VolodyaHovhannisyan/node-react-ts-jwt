import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect, useState } from 'react';
import { Context } from '.';
import './App.css';
import LoginForm from './components/LoginForm';
import { IUser } from './models/IUser'
import UserService from './services/UserService'

function App() {
  const { store } = useContext(Context)
  const [users, setUsers] = useState<IUser[]>([])

  useEffect(() => {
    if (localStorage.getItem('token')) {
      store.checkAuth()
    }
  }, [])

  async function getUsers() {
    try {
      const response = await UserService.fetchUsers()
      setUsers(response.data)
    } catch (error) {
      console.log(error);

    }
  }

  if (store.isLoading) {
    return (
      <div>Loading...</div>
    )
  }

  if (!store.isAuth) {
    return (
      <LoginForm />
    )
  }

  return (
    <div className="App">
      <h1>{store.isAuth ? `User ${store.user.email}` : 'Please log in'}</h1>
      <h1>{store.user.isActivated ? 'Account activated with email' : 'Your account needs an activaiton!!!'}</h1>
      <button onClick={() => store.logout()}>Logout</button>
      <div>
        <button onClick={() => getUsers()}>Load users list</button>
      </div>
      {users.map((user) =>
        <div key={user.email}> {user.email}</div>)}
    </div>
  );
}

export default observer(App);
