import {Observable} from 'rxjs/Observable';
import {TShellRequest} from '../../UltraCreation/Native/Abstract.Shell';

export type TLinearTable = '5v' | '3.3v' | '4v';

export interface IScriptFile
{
    Name?: string | null;
    Md5?: string | null;
    Content?: string | null;
    ContentBuffer?: Uint8Array | null;
    Duration?: number | null;
}

export interface IShell
{

    Shutdown(): Promise<void>;
    Reset(): Promise<void>;
    SetBluetoothName(Name: string): Promise<boolean>;
    SetDefaultFile(FileName: string, Idx: number): Promise<void>;
    ListDefaultFile(): Promise<Array<string>>;

    StartScriptFile(s: IScriptFile): Promise<void>;
    StopOutput(): Promise<void>;
    SetIntensity(Value: number): void;

    FileMd5(FileName: string): Promise<string>;
    CatFile(s: IScriptFile): Promise<Observable<number>>;
    RemoveFile(FileName: string): Promise<void>;

    FormatFileSystem(): Promise<void>;
    ClearFileSystem(ExcludeFiles: string[]): Promise<void>;

    SetLinearTable(n: TLinearTable): Promise<void>;
    OTARequest(Firmware: ArrayBuffer): Promise<TShellRequest>;
}

export abstract class TProxyShellRequest extends TShellRequest
{
    // TProxyShellRequest always has first Owner parameter
    //  *NOTE*
    //      this.Shell still derived from TShellRequest
    abstract Start(Proxy: IShell, ...args: any[]): void;
}
