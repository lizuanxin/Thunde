import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';

import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {IShell, TProxyShellRequest} from './shell.intf';

const FILE_CLEAR_EXCLUDES = ['DefaultFile', 'BLE_Name'];
const FILE_CLEAR_SIZE_LESS_THAN = 4096;
const FILE_CLEAR_MAX_COUNT = 64;

export class TClearFileSystemRequest extends TProxyShellRequest
{
    /// @override
    Start(Proxy: IShell, ExcludeFiles: Array<string>): void
    {
        this.Proxy = Proxy;
        this.ExcludeFiles = ExcludeFiles;

        this.Shell.PromiseSend('>ls')
            .catch(err => this.error(err));
    }

    /// @override
    Notification(Line: string)
    {
        if (TypeInfo.Assigned(this.Deleting))
            return;

        let strs = Line.split(':');
        // '1: end of ls'
        if (strs.length > 1 && strs[0] === '1')
        {
            this.Deleting = new Subject<void>();

            if (TypeInfo.Assigned(this.FileList) && this.FileList.length < FILE_CLEAR_MAX_COUNT)
            {
                for (let File of this.FileList)
                {
                    if (File.Size <= FILE_CLEAR_SIZE_LESS_THAN)
                        this.DeletingFiles.push(File.Name);
                }

                if (this.DeletingFiles.length > 0)
                {
                    this.SyncDeletingNext();
                    (this.Deleting as Observable<void>).toPromise()
                        .then(() => this.complete())
                        .catch(err => this.error(err));
                }
                else
                    this.complete();
            }
            else
            {
                this.Proxy.FormatFileSystem()
                    .catch(err => console.log('clearing filesystem error: ' + err.message))
                    .then(() => this.complete());
            }

            return;
        }
        // listing files:
        //  this.FileList = null when some error happens, this will cause format later
        else if (TypeInfo.Assigned(this.FileList))
        {
            let Idx = Line.indexOf(' ', 0);
            let Name = Line.substr(0, Idx);
            if (Name.length > 0)
            {
                let Size = parseInt(Line.substr(Idx + 1, Line.length), 10);

                // 24 = max file length of device supported
                if (Name.length > 24 || isNaN(Size) || Size < 0 || Size > 32768)
                    this.FileList = null;
                else if (FILE_CLEAR_EXCLUDES.indexOf(Name) === -1 && this.ExcludeFiles.indexOf(Name) === -1)
                    this.FileList.push({Name: Name, Size: Size});
            }
            else
                this.FileList = null;
        }
    }

    private SyncDeletingNext()
    {
        let name = this.DeletingFiles.pop() as string;

        this.Proxy.RemoveFile(name)
            .then(() =>
            {
                if (this.DeletingFiles.length > 0)
                    setTimeout(() => this.SyncDeletingNext(), 0);
                else
                    this.Deleting.complete();
            })
            .catch(err => console.log(err.message));
    }

    Proxy: IShell;
    FileList: (Array<{Name: string, Size: number}>) | null = [];
    ExcludeFiles: Array<string>;

    Deleting: Subject<void>;
    DeletingFiles = new Array<string>();
}
