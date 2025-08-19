import { FakeStoreAPI, LoginResult } from './fakeStore';

export class AuthService {
  private fakeStoreAPI = new FakeStoreAPI();

  async loginUser(username: string, password: string): Promise<LoginResult> {
    return this.fakeStoreAPI.login(username, password);
  }
}
