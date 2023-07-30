import { Observable, map, of, switchMap } from "rxjs";
import { UserService } from "../user/user_service";
import { AppUser } from "../user/app_user";

interface NetworkRequest {
  path: string;
  payload: object;
}

export class NetworkService {
  private static instance: NetworkService;
  private readonly appUser = AppUser.getInstance();

  private constructor() {}

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }

    return NetworkService.instance;
  }

  public fetch(path: string, payload = {}): Observable<any> {
    return of(payload).pipe(
      map((payload) => {
        let request = { payload };
        const userId = this.appUser.getUserID();
        if (!!userId) request = Object.assign(request, { userId });
        return request;
      }),
      switchMap((request) => this.networkRequest(path, request))
    );
  }

  private networkRequest(path: string, request: object): Promise<any> {
    return fetch(`http://localhost/bdpain/server/${path}`, {
      method: "POST",
      body: JSON.stringify(request),
    }).then((response) => response.json());
  }
}