import {TypeInfo, EAbort} from '../../UltraCreation/Core';
import {THashCrc16} from '../../UltraCreation/Hash';
import {IShell, TProxyShellRequest} from './shell.intf';

const OTA_WINDOW_SIZE = 24;
const OTA_SPLIT_PACKET_SIZE = 16;
const OTA_PACKET_SIZE = OTA_SPLIT_PACKET_SIZE + 4;

/* EUSBRestarting */

export class EUSBRestarting extends EAbort
{

}

/* TOTARequest */

export class TOTARequest extends TProxyShellRequest
{
    Start(Proxy: IShell, Firmware: ArrayBuffer): void
    {
        this.NoConnectionTimeout();

        this.FirmwareSize = Firmware.byteLength;
        this.CRC = this.SplitPacket(Firmware);

        this.Shell.PromiseSend('>ota -s=' + this.FirmwareSize + ' -c=' + this.CRC)
            .catch(err => this.error(err));
    }

    Notification(Line: string)
    {
        console.log('OTA Notification: ' + Line);

        this.RefreshTimeout();

        let Strs = Line.split(':');
        let Status = 0;
        if (Strs.length > 1)
        {
            Status = parseInt(Strs[0], 10);

            if (Status === 0)
            {
                if (this.Sent === 0)
                    this.StartSendingPacket();
                else
                    this.complete();
            }
            else if ((Status & 0x8000) !== 0)
            {
                console.log('OTA error ' + Line);
                this.error(new Error('e_ota_failure'));
            }
        }
        else if (Line === 'crc error')
        {
            console.log('OTA crc error');
            this.error(new Error('e_ota_failure'));
        }
        else if (Line.indexOf('jump') !== -1)
        {
            console.log('usb resetting...');
            this.error(new EUSBRestarting());
        }
        else
            this.HandleReponse(Line);
    }

    SplitPacket(Firmware: ArrayBuffer): number
    {
        let Count = Math.trunc((Firmware.byteLength + OTA_SPLIT_PACKET_SIZE - 1) / OTA_SPLIT_PACKET_SIZE);
        this.PacketBuffer = new ArrayBuffer(Count * OTA_PACKET_SIZE);

        let CRC = new THashCrc16();
        for (let i = 0; i < Firmware.byteLength; i += OTA_SPLIT_PACKET_SIZE)
        {
            let ViewSRC: Uint8Array;
            if (Firmware.byteLength - i > OTA_SPLIT_PACKET_SIZE)
                ViewSRC = new Uint8Array(Firmware, i, OTA_SPLIT_PACKET_SIZE);
            else
                ViewSRC = new Uint8Array(Firmware, i, Firmware.byteLength - i);
            CRC.Update(ViewSRC);

            let Offset = i / OTA_SPLIT_PACKET_SIZE * OTA_PACKET_SIZE;
            let DataView = new Uint8Array(this.PacketBuffer, Offset + 4, OTA_SPLIT_PACKET_SIZE);
            DataView.set(ViewSRC);

            let HeadView = new Uint16Array(this.PacketBuffer, Offset, 2);
            HeadView[0] = i;
            HeadView[1] = THashCrc16.Get(DataView).Value();
        }

        CRC.Final();
        return CRC.Value();
    }

    private StartSendingPacket()
    {
        setTimeout(() =>
        {
            this.SendPacket(0, OTA_WINDOW_SIZE);
            this.MonitorOutgoing(0);
        }, 1000);
    }

    private SendPacket(Offset: number, Count: number)
    {
        if (this.isStopped)
            return;
        if (this.LastSentOffset === this.FirmwareSize)
            return;
        this.LastSentOffset = Offset + Count * OTA_SPLIT_PACKET_SIZE;

        Offset = Offset / OTA_SPLIT_PACKET_SIZE * OTA_PACKET_SIZE;
        let Size = Count * OTA_PACKET_SIZE;

        if (Offset + Size > this.PacketBuffer.byteLength)
        {
            Size = this.PacketBuffer.byteLength - Offset;
            Count = Size / OTA_PACKET_SIZE;
            this.LastSentOffset = this.FirmwareSize;
        }

        let View = new Uint8Array(this.PacketBuffer, Offset, Size);

        this.OutgoingCount += Count;

        if (TypeInfo.Assigned(this.Shell))
        {
            this.Shell.PromiseSend(View)
                .then(value => this.next(this.LastSentOffset / this.FirmwareSize))
                .catch(err => this.error(err));
        }
    }

    private HandleReponse(Line: string)
    {
        if (! this.isStopped)
        {
            if (this.OutgoingCount > 0)
                this.OutgoingCount --;

            // somehow android received error BLE notify packet, but it ok to continue
            /*
            let Offset = parseInt(Line);
            if (isNaN(Offset))
            {
                this.error(new Error('NaN offset'));
                return;
            }
            */

            if (this.OutgoingCount < Math.trunc(OTA_WINDOW_SIZE / 4))
                this.SendPacket(this.LastSentOffset, OTA_WINDOW_SIZE - this.OutgoingCount);
        }
    }

    private MonitorOutgoing(LastCount: number)
    {
        if (! this.isStopped)
        {
            // for a long time OutgoingCount has not been changed=
            if (LastCount <= OTA_WINDOW_SIZE / 4 && LastCount === this.OutgoingCount)
            {
                console.log('OTA reset outgoing counter');
                // reset outgoing window
                this.OutgoingCount = 0;
                this.SendPacket(this.LastSentOffset, OTA_WINDOW_SIZE);
            }

            if (this.OutgoingCount > 0)
                setTimeout(() => this.MonitorOutgoing(this.OutgoingCount), 1500);
        }
    }

    private NoConnectionTimeout()
    {
        if (! this.isStopped)
        {
            this.Shell.RefreshConnectionTimeout();
            setTimeout(() => this.NoConnectionTimeout(), 1000);
        }
    }

    private PacketBuffer: ArrayBuffer;
    private CRC: number;
    private Sent: number = 0;
    private LastSentOffset: number;
    private FirmwareSize: number;
    private OutgoingCount: number = 0;
}
