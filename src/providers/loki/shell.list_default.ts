import {IShell, TProxyShellRequest} from './shell.intf';

export class TListDefaultFile extends TProxyShellRequest
{
    /// @override
    Start(Proxy: IShell): void
    {
        this.Shell.PromiseSend('>dump DefaultFile')
            .catch(err => this.error(err));
    }

    /// @override
    Notification(Line: string)
    {
        let Strs = Line.split('=');
        if (Strs.length > 1)
        {
            if (Strs[0] === 'sdef')
            {
                let Name = Strs[1].split(',')[0];
                if (Name.length > 0)
                    this.RetVal.push(Name);
            }

            this.RefreshTimeout();
            return;
        }

        Strs = Line.split(':');
        // error or '2: end of dump'
        if (Strs.length > 1 && (Strs[0] === '32772' || Strs[0] === '2'))
        {
            this.next(this.RetVal);
            this.complete();
        }
        else if (this.RetVal.indexOf(Strs[0]) === -1)
        {
            this.RefreshTimeout();
            this.RetVal.push(Strs[0]);
        }
    }

    RetVal: Array<string> = [];
}
