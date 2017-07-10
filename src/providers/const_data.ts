import {IMode, IBodyPart, ICategory, IScriptFile} from '.'

export namespace const_data
{
    export const DatabaseName           = 'ThunderboltDB';

    export const Anonymous =
        {Id: '{00000000-0000-4000-0000-000000000000}', Name: 'anonymous', Email: ''};

    // do not use this: dummy for bluetens
    export const Modes: Array<IMode> =
    [
    ]

    export const BodyParts: Array<IBodyPart> =
    [
        {Id: 'neck',        Name: 'neck',
            Icon: 0xE91F, Desc: JSON.stringify([0xE914])},
        {Id: 'shoulder',    Name: 'shoulder',
            Icon: 0xE91A, Desc: JSON.stringify([0xE946, 0xE932])},
        {Id: 'back',        Name: 'back',
            Icon: 0xE904, Desc: JSON.stringify([0xE943])},
        {Id: 'waist',       Name: 'waist',
            Icon: 0xE915, Desc: JSON.stringify([0xE9FD])},
        {Id: 'upperarm',    Name: 'upperarm',
            Icon: 0xE903, Desc: JSON.stringify([0xE9A4])},
        {Id: 'elbow',       Name: 'elbow',
            Icon: 0xE90E, Desc: JSON.stringify([0xE970])},
        {Id: 'forearm',     Name: 'forearm',
            Icon: 0xE910, Desc: JSON.stringify([0xEA14])},
        {Id: 'wrist',       Name: 'wrist',
            Icon: 0xE920, Desc: JSON.stringify([0xE95b])},
        {Id: 'abdomen',     Name: 'abdomen',
            Icon: 0xE900, Desc: JSON.stringify([0xE959])},
        {Id: 'buttock',     Name: 'buttock',
            Icon: 0xE905, Desc: JSON.stringify([0xE91A])},
        {Id: 'thigh',       Name: 'thigh',
            Icon: 0xE91D, Desc: JSON.stringify([0xe915])},
        {Id: 'knee',        Name: 'knee',
            Icon: 0xE913, Desc: JSON.stringify([0xEA25])},
        {Id: 'calf',        Name: 'calf',
            Icon: 0xE906, Desc: JSON.stringify([0xEA58])},
        {Id: 'ankle',       Name: 'ankle',
            Icon: 0xE902, Desc: JSON.stringify([0xE9B9])},
        {Id: 'foot',        Name: 'foot',
            Icon: 0xE90F, Desc: JSON.stringify([0xE9CB])},
    ]

    export const Body =
    {
        neck: BodyParts[0],
        shoulder: BodyParts[1],
        back: BodyParts[2],
        waist: BodyParts[3],
        upperarm: BodyParts[4],
        elbow: BodyParts[5],
        forearm: BodyParts[6],
        wrist: BodyParts[7],
        abdomen: BodyParts[8],
        buttock: BodyParts[9],
        thigh: BodyParts[10],
        knee: BodyParts[11],
        calf: BodyParts[12],
        ankle: BodyParts[13],
        foot: BodyParts[14],
    }

    export const BodyCategory =
    {
        all: null as any,
        none: [] as any[],

        back: [Body.shoulder, Body.neck, Body.back],
        forelimb: [Body.upperarm, Body.forearm],
        lowerlimb: [Body.calf, Body.thigh],
        joint: [Body.ankle, Body.elbow, Body.knee, Body.wrist],

        muscle: [Body.shoulder, Body.back, Body.upperarm, Body.buttock, Body.thigh, Body.calf],
        fat: [Body.abdomen, Body.buttock, Body.thigh, Body.upperarm]
    }

    export const Categories: Array<ICategory> =
    [
        {Id: 'relax', Icon: 0xe917, Name: 'relax'},
        {Id: 'muscle_training', Icon: 0xe91e, Name: 'muscle_training'},
        {Id: 'fat_burning', Icon: 0xe905, Name: 'fat_burning'},
    ]

    export const Category =
    {
        relax: Categories[0],
        muscle_training: Categories[1],
        fat_burning: Categories[2],
    }

    export const ScriptFile: Array<IScriptFile> =
    [
        {Id: '{00000000-0000-4000-4000-000000000010}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id,  Mode_Id: null, Name: 'knock',
            BodyParts: BodyCategory.all},
        {Id: '{00000000-0000-4000-4000-000000000011}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'press',
            BodyParts: BodyCategory.all},
        {Id: '{00000000-0000-4000-4000-000000000012}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'twist',
            BodyParts: BodyCategory.all},
        {Id: '{00000000-0000-4000-4000-000000000013}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'knead',
            BodyParts: BodyCategory.all},
        {Id: '{00000000-0000-4000-4000-000000000014}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'sore',
            BodyParts: BodyCategory.all},
        {Id: '{00000000-0000-4000-4000-000000000015}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'pain',
            BodyParts: BodyCategory.all},
        {Id: '{00000000-0000-4000-4000-000000000016}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'han',
            BodyParts: BodyCategory.all},

        {Id: '{00000000-0000-4000-4000-000000000001}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'joint',
            BodyParts: BodyCategory.joint},
        {Id: '{00000000-0000-4000-4000-000000000002}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'shoulder',
            BodyParts: [Body.shoulder]},
        {Id: '{00000000-0000-4000-4000-000000000003}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'upperarm',
            BodyParts: [Body.upperarm]},
        {Id: '{00000000-0000-4000-4000-000000000004}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'waist',
            BodyParts: [Body.waist]},
        {Id: '{00000000-0000-4000-4000-000000000005}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'leg',
            BodyParts: BodyCategory.lowerlimb},
        {Id: '{00000000-0000-4000-4000-000000000006}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'soles',
            BodyParts: [Body.foot]},

        {Id: '{00000000-0000-4000-4100-000000000001}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_a',
            BodyParts: BodyCategory.fat},
        {Id: '{00000000-0000-4000-4100-000000000002}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_b',
            BodyParts: BodyCategory.fat},
        {Id: '{00000000-0000-4000-4100-000000000003}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_c',
            BodyParts: BodyCategory.fat},
        {Id: '{00000000-0000-4000-4100-000000000004}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_d',
            BodyParts: BodyCategory.fat},
        {Id: '{00000000-0000-4000-4100-000000000005}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_e',
            BodyParts: BodyCategory.fat},
        {Id: '{00000000-0000-4000-4100-000000000006}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_f',
            BodyParts: BodyCategory.fat},
        {Id: '{00000000-0000-4000-4100-000000000007}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_g',
            BodyParts: BodyCategory.fat},

        {Id: '{00000000-0000-4000-4100-000000004001}', Author: 'UltraCreation Team',
            Category_Id: Category.muscle_training.Id, Mode_Id: null, Name: 'dumbbell',
            BodyParts: BodyCategory.none, Icon: 0xe948},
        {Id: '{00000000-0000-4000-4100-000000004002}', Author: 'UltraCreation Team',
            Category_Id: Category.muscle_training.Id, Mode_Id: null, Name: 'push_ups',
            BodyParts: BodyCategory.none, Icon: 0xe947},
        {Id: '{00000000-0000-4000-4100-000000004003}', Author: 'UltraCreation Team',
            Category_Id: Category.muscle_training.Id, Mode_Id: null, Name: 'sit_ups',
            BodyParts: BodyCategory.none, Icon: 0xe949},
        ]
}
