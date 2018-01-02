import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Connector, FireLoopRef, Message, User} from '../../shared/sdk/models';
import {RealTime, UserApi} from '../../shared/sdk/services';
import {Subscription} from 'rxjs/Subscription';
import {Reception} from '../../shared/sdk/models/Reception';
import {ReceptionApi} from '../../shared/sdk/services/custom/Reception';
import {AgmMap} from '@agm/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit, OnDestroy {

  private user: User;

  @ViewChild('baseStationMap') baseStationMap: any;
  @ViewChild(AgmMap) agmMap: AgmMap;

  private receptions: any[] = new Array<any>();

  private messageSub: Subscription;
  private messages: Message[] = new Array<Message>();
  private messageRef: FireLoopRef<Message>;

  public filterQuery = '';

  public toInt(num: string) {
    return +num;
  }

  constructor(private rt: RealTime,
              private userApi: UserApi,
              private receptionApi: ReceptionApi) { }

  ngOnInit(): void {
    console.warn('Messages: ngOnInit');
    // Get the logged in User object
    this.user = this.userApi.getCachedCurrent();

    this.setup();

    /*if (
      this.rt.connection.isConnected() &&
      this.rt.connection.authenticated
    ) {
      this.rt.onReady().subscribe(() => this.setup());
    } else {
      this.rt.onAuthenticated().subscribe(() => this.setup());
      this.rt.onReady().subscribe();
    }*/
  }

  setup(): void {
    // this.ngOnDestroy();
    // Messages
    this.messageRef = this.rt.FireLoop.ref<Message>(Message);
    // this.messageRef = this.userRef.make(this.user).child<Message>('Messages');
    this.messageSub = this.messageRef.on('change',
      {
        limit: 1000,
        order: 'createdAt DESC',
        include: ['Device'],
        where: {
          userId: this.user.id
        }
      }
    ).subscribe((messages: Message[]) => {
      this.messages = messages;
      console.log(this.messages);
    });
  }

  ngOnDestroy(): void {
    console.warn('Messages: ngOnDestroy');
    if (this.messageRef) this.messageRef.dispose();
    if (this.messageSub) this.messageSub.unsubscribe();
  }

  remove(message: Message): void {
    this.messageRef.remove(message).subscribe();
  }

  showBaseStations(deviceId: string, time: number): void {
    this.receptions = [];
    const user = this.userApi.getCachedCurrent();

    this.userApi.getConnectors(this.user.id, {where: {name: 'sigfox-api'}}).subscribe((connectors: Connector[]) => {
      if (connectors.length > 0) {

        this.baseStationMap.show();

        this.receptionApi.getBaseStationsByDeviceId(deviceId, time).subscribe((receptionsResult: Reception[]) => {
            this.receptions = receptionsResult;
            console.log(this.receptions);
            if (this.receptions.length > 0)
              this.agmMap.triggerResize();
          }, error => {
            console.log(error);
          }
        );
      } else {
        console.log('No Sigfox API connector');
      }
    });
  }

  download(): void {

  }
}
