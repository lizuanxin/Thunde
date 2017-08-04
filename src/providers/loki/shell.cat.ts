import {Observable} from 'rxjs/Observable';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {EAbort} from '../../UltraCreation/Core/Exception';
import {IShell, TProxyShellRequest} from './shell.intf';

export class TCatRequest extends TProxyShellRequest
{
    /// @override
    Start(Proxy: IShell, FileName: string, FileBuffer: Uint8Array, Md5: string): void
    {
        let Count = FileBuffer.byteLength;

        Proxy.FileMd5(FileName)
            .then(value =>
            {
                if (value.toUpperCase() === Md5)
                    return Promise.reject(new EAbort());
                else
                    return Promise.resolve();
            })
            .then(() =>
            {
                if (TypeInfo.Assigned(this.Shell))
                    return this.Shell.PromiseSend('>cat ' + FileName + ' -l=' + FileBuffer.byteLength);
                else
                    return Promise.reject(new EAbort());
            })
            .then(() =>
            {
                if (TypeInfo.Assigned(this.Shell))
                    return this.Shell.ObserveSend(FileBuffer);
                else
                    return Promise.reject(new EAbort());
            })
            .then((Observer: Observable<number>) =>
            {
                return new Promise((resolve, reject) =>
                {
                    Observer.subscribe(
                        Written =>
                        {
                            this.RefreshTimeout();
                            this.next(Written / Count);
                        },
                        err => reject(err),
                        () => resolve());
                });
            })
            .catch(err =>
            {
                if (err instanceof EAbort)
                    this.complete();
                else
                    this.error(err);
            });
    }

    /// @override
    Notification(Line: string)
    {
        let strs = Line.split(':');
        // '3: end of cat'
        if (strs.length > 1 && strs[0] === '3')
            this.complete();
    }
}
