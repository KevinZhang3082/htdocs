import { NetworkService } from "../../../contrib/services/network/network_service";
import { Subject, Observable, share, switchMap, map } from "rxjs";
import { SessionType } from "./lib";
import { UserService } from "../../user/services/user_service/user_service";

interface SessionRequest {
  view: SessionType;
  viewed_id?: string;
}

interface SessionRefreshRequest {
  session_id: string;
  destroy: boolean;
}

interface SessionCountRequest {
  type: "profile" | "opportunity";
  id: string;
  key: string;
}

export class SessionService {
  private readonly networkService = NetworkService.getInstance();
  private readonly userService = UserService.getInstance();
  private readonly requestCreate$ = new Subject<SessionRequest>();
  private readonly responseCreate$: Observable<object>;

  private readonly requestRefresh$ = new Subject<SessionRefreshRequest>();
  private readonly responseRefresh$: Observable<object>;

  private readonly requestCount$ = new Subject<SessionCountRequest>();
  private readonly responseCount$: Observable<object>;
  private static instance: SessionService;

  private constructor() {
    this.responseCreate$ = this.requestCreate$.pipe(
      switchMap((request) => {
        const payload = {
          view: request.view,
          viewed_id: request.viewed_id || null,
        };
        return this.networkService.fetch("session/create_session.php", {
          payload,
          user_id: this.userService.getId(),
        });
      }),
      share()
    );

    this.responseRefresh$ = this.requestRefresh$.pipe(
      switchMap((request) => {
        const path = request.destroy
          ? "remove_session.php"
          : "update_session.php";
        return this.networkService.fetch(`session/${path}`, {
          payload: {
            session_id: request.session_id,
          },
          user_id: this.userService.getId(),
        });
      }),
      share()
    );

    this.responseCount$ = this.requestCount$.pipe(
      switchMap((request) =>
        this.networkService
          .fetch("session/count_session.php", {
            payload:
              request.type === "profile"
                ? {
                    user_id: request.id,
                  }
                : {
                    opportunity_id: request.id,
                  },
            user_id: this.userService.getId(),
          })
          .pipe(
            map((response) => {
              return { ...response, key: request.type };
            })
          )
      ),
      share()
    );
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }

    return SessionService.instance;
  }

  feedCreateSession(request: SessionRequest) {
    this.requestCreate$.next(request);
  }

  feedRefreshSession(request: SessionRefreshRequest) {
    this.requestRefresh$.next(request);
  }

  feedCountSession(request: SessionCountRequest) {
    this.requestCount$.next(request);
  }

  onSessionCreateSuccess(callback: (response: any) => void) {
    const subscriber = this.responseCreate$.subscribe(callback);
    return () => {
      subscriber.unsubscribe();
    };
  }

  onSessionRefreshSuccess(callback: (response: any) => void) {
    const subscriber = this.responseRefresh$.subscribe(callback);
    return () => {
      subscriber.unsubscribe();
    };
  }

  onSessionCountSuccess(callback: (response: any) => void) {
    const subscriber = this.responseCount$.subscribe(callback);
    return () => {
      subscriber.unsubscribe();
    };
  }
}
