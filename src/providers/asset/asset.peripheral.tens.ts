import {TypeInfo} from '../../UltraCreation/Core/TypeInfo';
import {TAbstractShell} from '../../UltraCreation/Native/Abstract.Shell';

import {TConnectablePeripheral, PeripheralFactory} from './asset.peripheral';
import {TShell} from '../loki/shell';

/* TTensPeripheral */

export class TTensPeripheral extends TConnectablePeripheral
{
    /// @override
    static ClassName = 'Tens';
    /// @override
    static ProductName = 'UltraCreation Tens';
    /// @override
    static AdName = ['uctenqt3', 'thunderbolt', 'uctenqt1', '.blt', 'bluetensx']

    /// @override
    get Icon_Id(): number
    {
        return 0xE932;
    }

    get Shell(): TAbstractShell
    {
        if (TypeInfo.Assigned(this.ConnectId))
            return TShell.Get(this.ConnectId);
        else
            return TShell.Get(this.Id as string);
    }
};

/* TBluetens */

export class TBluetens extends TConnectablePeripheral
{
    /// @override
    static ClassName = 'Bluetens';
    /// @override
    static ProductName = 'UltraCreation Bluetens';
    /// @override
    static AdName = ['bluetensx', 'bluetensq', 'bluetens.blt', 'bluetensq.blt']

    /// @override
    get Icon_Id(): number
    {
        return 0xE932;
    }

    get Shell(): TAbstractShell
    {
        if (TypeInfo.Assigned(this.ConnectId))
            return TShell.Get(this.ConnectId);
        else
            return TShell.Get(this.Id as string);
    }
};

PeripheralFactory.Register(TTensPeripheral);
PeripheralFactory.Register(TBluetens);
