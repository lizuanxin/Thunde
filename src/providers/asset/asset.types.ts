import {TypeInfo} from "../../UltraCreation/Core/TypeInfo";
import {TGuid} from '../../UltraCreation/Core/Guid';
import {IPersistable, TPersistable, TPersistPropRule} from '../../UltraCreation/Core/Persistable'
import {const_data} from '..';

/* TAsset */

export interface IAsset extends IPersistable
{
    Id: string;

    Name: string;
    Desc: string;
};

export class TAsset extends TPersistable implements IAsset
{
    constructor(public ObjectName: string)
    {
        super();

        // create hidden ExtraProp
        (this as any)['ExtraProp'] = null;
    }

    Id: string = null;
    Name: string = null;
    Owner: string = null;
    Desc: string = null;
    Timestamp: Date = null;

    ExtraProps: Map<string, any> | any = new Map<string, any>();

/* TAssignable */

    protected AfterAssignProperties(): void
    {
        super.AfterAssignProperties();

        let ExtraProp = (this as any)['ExtraProp'];
        if (TypeInfo.Assigned(ExtraProp))
        try
        {
            switch (ExtraProp[0])
            {
            case '{':   // JSON object
                this.ExtraProps = JSON.parse(ExtraProp);
                break;

            case '[':   // JSON array
                let ary: Array<[string, any]> = JSON.parse(ExtraProp);
                ary.forEach(iter => this.ExtraProps.set(iter[0], iter[1]));
                break;

            default:
                console.error('unknown ExtraProp type')
            }
        }
        catch(e)
        {
            console.error('Asset unable to parse ExtraProp: ' + ExtraProp);
        }

        // correction SQL query Date type
        if (TypeInfo.IsString(this.Timestamp))
        {
            this.Timestamp = new Date(this.Timestamp);
            let Offset = this.Timestamp.getTimezoneOffset() * 60 * 1000;
            this.Timestamp = new Date(this.Timestamp.getTime() - Offset);
        }
    }

/* TPersistable */

    GenerateKeyProps(...args: any[]): Promise<void>
    {
        if (! TypeInfo.Assigned(this.Id))
            this.Id = TGuid.Generate();

        if (! TypeInfo.Assigned(this.Owner))
            this.Owner = const_data.Anonymous.Id;

        return Promise.resolve();
    }

    BeforeSave(): Promise<void>
    {
        return super.BeforeSave().then(() =>
        {
            if (TypeInfo.Assigned(this.ExtraProps))
            {
                if (this.ExtraProps instanceof Map)
                {
                    if (this.ExtraProps.size > 0)
                       (this as any)['ExtraProp']= JSON.stringify(Array.from(this.ExtraProps));
                }
                else
                    (this as any)['ExtraProp']= JSON.stringify(this.ExtraProps);
            }
        })
    }

    DefineKeyProps(KeyProps: Array<string>): void
    {
        KeyProps.push('Id');
    }

    DefinePropRules(PropRules: Array<TPersistPropRule>): void
    {
        super.DefinePropRules(PropRules);
        PropRules.push(new TPersistPropRule('Asset', ['ObjectName', 'Name', 'Desc', 'ExtraProp', 'Owner']))
    }
};

/* TLangAsset */

export class TLangAsset extends TAsset
{
    get Name_LangId(): string
    {
        return (this.ObjectName + '.' + this.Name).toLowerCase();
    }

    get Desc_LangId(): string
    {
        return (this.ObjectName + '.' + this.Desc).toLowerCase();
    }
}
