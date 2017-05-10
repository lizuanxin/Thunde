import {inplace_files} from './inplace_files'
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
        {Id: '{00000000-0000-4000-2000-000000000001}', Name: 'neck',
            Icon: 0xE91F, Desc: JSON.stringify([0xE914])},
        {Id: '{00000000-0000-4000-2000-000000000002}', Name: 'shoulder',
            Icon: 0xE91A, Desc: JSON.stringify([0xE932])},
        {Id: '{00000000-0000-4000-2000-000000000003}', Name: 'back',
            Icon: 0xE904, Desc: JSON.stringify([0xE943])},
        {Id: '{00000000-0000-4000-2000-000000000004}', Name: 'waist',
            Icon: 0xE915, Desc: JSON.stringify([0xE9FD])},
        {Id: '{00000000-0000-4000-2000-000000000005}', Name: 'upperarm',
            Icon: 0xE903, Desc: JSON.stringify([0xE933, 0xE9A4])},
        {Id: '{00000000-0000-4000-2000-000000000006}', Name: 'elbow',
            Icon: 0xE90E, Desc: JSON.stringify([0xE970])},
        {Id: '{00000000-0000-4000-2000-000000000007}', Name: 'forearm',
            Icon: 0xE910, Desc: JSON.stringify([0xEA13, 0xEA14])},
        {Id: '{00000000-0000-4000-2000-000000000008}', Name: 'wrist',
            Icon: 0xE920, Desc: JSON.stringify([0xE95b])},
        {Id: '{00000000-0000-4000-2000-000000000009}', Name: 'abdomen',
            Icon: 0xE900, Desc: JSON.stringify([0xE959])},
        {Id: '{00000000-0000-4000-2000-00000000000A}', Name: 'buttock',
            Icon: 0xE905, Desc: JSON.stringify([0xE91A])},
        {Id: '{00000000-0000-4000-2000-00000000000B}', Name: 'thigh',
            Icon: 0xE91D, Desc: JSON.stringify([0xe915,0xe916])},
        {Id: '{00000000-0000-4000-2000-00000000000C}', Name: 'knee',
            Icon: 0xE913, Desc: JSON.stringify([0xEA25])},
        {Id: '{00000000-0000-4000-2000-00000000000D}', Name: 'calf',
            Icon: 0xE906, Desc: JSON.stringify([0xEA3E, 0xEA58])},
        {Id: '{00000000-0000-4000-2000-00000000000E}', Name: 'ankle',
            Icon: 0xE902, Desc: JSON.stringify([0xE9B9])},
        {Id: '{00000000-0000-4000-2000-00000000000F}', Name: 'foot',
            Icon: 0xE90F, Desc: JSON.stringify([0xE9CB, 0xE9DE])},
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
        all: null,
        none: [],

        back: [Body.shoulder, Body.neck, Body.back],
        forelimb: [Body.upperarm, Body.forearm],
        lowerlimb: [Body.calf, Body.thigh],
        joint: [Body.ankle, Body.elbow, Body.knee, Body.wrist],

        muscle: [Body.shoulder, Body.back, Body.upperarm, Body.buttock, Body.thigh, Body.calf],
        fat: [Body.abdomen, Body.buttock, Body.thigh, Body.upperarm]
    }

    export const Categories: Array<ICategory> =
    [
        {Id: '{00000000-0000-4000-3000-000000000001}', Icon: 0xe917, Name: 'relax'},
        {Id: '{00000000-0000-4000-3000-000000000002}', Icon: 0xe91e, Name: 'muscle_training'},
        {Id: '{00000000-0000-4000-3000-000000000003}', Icon: 0xe905, Name: 'fat_burning'},
        {Id: '{00000000-0000-4000-3000-FFFFFFFFFFFF}', Icon: 0xe905, Name: 'recommend'},
    ]

    export const Category =
    {
        relax: Categories[0],
        muscle_training: Categories[1],
        fat_burning: Categories[2],
        recommend: Categories[3],
    }

    export const ScriptFile: Array<IScriptFile> =
    [
        {Id: '{00000000-0000-4000-4000-000000000011}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id,  Mode_Id: null, Name: 'knock',
            BodyParts: BodyCategory.all, Content: inplace_files.file1_knock},
        {Id: '{00000000-0000-4000-4000-000000000011}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'press',
            BodyParts: BodyCategory.all, Content: inplace_files.file4_press},
        {Id: '{00000000-0000-4000-4000-000000000012}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'twist',
            BodyParts: BodyCategory.all, Content: inplace_files.file5_twist},
        {Id: '{00000000-0000-4000-4000-000000000013}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'knead',
            BodyParts: BodyCategory.all,
            Content: inplace_files.file9_soft_knead},
        {Id: '{00000000-0000-4000-4000-000000000014}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'sore',
            BodyParts: BodyCategory.all,
            Content: inplace_files.file3_sore_therpy},
        {Id: '{00000000-0000-4000-4000-000000000015}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'pain',
            BodyParts: BodyCategory.all,
            Content: inplace_files.file11_pain_treatment},
        {Id: '{00000000-0000-4000-4000-000000000016}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'han',
            BodyParts: BodyCategory.all,
            Content: 'V1D16{R12c|F64P32C12c|R6Pc8F2C1}'},

        {Id: '{00000000-0000-4000-4000-000000000001}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'joint',
            BodyParts: BodyCategory.joint,
            Content: inplace_files.file6_joint},
        {Id: '{00000000-0000-4000-4000-000000000002}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'shoudler',
            BodyParts: [Body.shoulder],
            Content: inplace_files.file7_shoulder},
        {Id: '{00000000-0000-4000-4000-000000000003}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'upperarm',
            BodyParts: [Body.upperarm],
            Content: inplace_files.file10_upperarm},
        {Id: '{00000000-0000-4000-4000-000000000004}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'waist',
            BodyParts: [Body.waist],
            Content: inplace_files.file12_waist},
        {Id: '{00000000-0000-4000-4000-000000000005}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'leg',
            BodyParts: BodyCategory.lowerlimb,
            Content: inplace_files.file2_leg},
        {Id: '{00000000-0000-4000-4000-000000000006}', Author: 'UltraCreation Team',
            Category_Id: Category.relax.Id, Mode_Id: null, Name: 'soles',
            BodyParts: [Body.foot],
            Content: inplace_files.file8_soles},

        {Id: '{00000000-0000-4000-4100-000000000001}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_a',
            BodyParts: BodyCategory.fat,
            Content: 'V1D16{R5a|R5F32P32C7I1b0|P64|P96|P12c|P96|P64|P32}'},
        {Id: '{00000000-0000-4000-4100-000000000002}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_b',
            BodyParts: BodyCategory.fat,
            Content: 'V1D16{R4b|R1P96F6|F8|Fa|Fc|Fe|F10|F12|F14|F16|F18|F1a|F1c|F1e|F20|F22|F24|F26|R118F28|R2F27|F25|F23|R1F21|F1f|F1d|F1b|F19|F17|F15|F13|F11|Ff|Fd|Fb|F9|F7|R5aF6}'},
        {Id: '{00000000-0000-4000-4100-000000000003}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_c',
            BodyParts: BodyCategory.fat,
            Content: 'V1D16{Rbb8I80|P96F20|F21|F22|F23|F24|F25|F26|F27|F28|F29|F2a|F2b|F2c|F2d|F2e|F2f|F30|F31|F32}'},
        {Id: '{00000000-0000-4000-4100-000000000004}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_d',
            BodyParts: BodyCategory.fat,
            Content: 'V1D16{R709I14d|R1P32F36|P34|P36|P38|P3a|P3c|P3e|P40|P42|P44|P46|P48|P4a|P4c|P4e|P50|P52|P54|P56|P58|P5a|P5c|P5e|P60|P62|P64|P66|P68|P6a|P6c|P6e|P70|P72|P74|P76|P78}'},
        {Id: '{00000000-0000-4000-4100-000000000005}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_e',
            BodyParts: BodyCategory.fat,
            Content: 'V1D16{R2ee|R1Ic8P96F4C4|R4Id0F36C5}'},
        {Id: '{00000000-0000-4000-4100-000000000006}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_f',
            BodyParts: BodyCategory.fat,
            Content: 'V1D16{R4b0|R1I190P64F64Ca|P96F32C5|I12cF19}'},
        {Id: '{00000000-0000-4000-4100-000000000007}', Author: 'UltraCreation Team',
            Category_Id: Category.fat_burning.Id, Mode_Id: null, Name: 'fb_g',
            BodyParts: BodyCategory.fat,
            Content: 'V1D16{R2b|R5P96F14I50|F15|F16|F17|R6F18|F19|F1a|F1b|F1c|F1d|F1e|F1f|F20|F21|F22|F23|F24|F25|F26|F27|F28|F29|F2a|F2b|F2c|F2d|F2e|F2f|F30|F31|F32|F33|F34|F35|F36|F35|F34|F33|F32|F31|F30|F2f|F2e|F2b|F2a|F29|F28|F27|F26|F25|F24|F23|F22|F21|F20|F1f|F1e|F1d|F1c|F1b|F1a|F19|R5F18|F17|F16|F15}'},

        {Id: '{00000000-0000-4000-4100-000000004001}', Author: 'UltraCreation Team',
            Category_Id: Category.muscle_training.Id, Mode_Id: null, Name: 'dumbbell',
            BodyParts: BodyCategory.none, Icon: 0xe948,
            Content: 'V1D16{|R1P96F6C5a}{R4a|R1P12cF6|F7|F8|F9|Fa|Fb|Fc|Fd|Fe|Ff|F10|F11|F12|F13|F14|F15|F16|F17|F18|F19|F1a|F1b|F1c|F1d|F1e|F1f|F20|F21|F22|F23|F24|F25|F26|F27|F28|F29|F2a|F2b|F2c|F2d|F2e|F2f|F30|F31|F32|F33|F34|F35|F36|F37|F38|F39|F3a|F3b|F3c|F3d|F3e|F3f|F40|F41|F42|F43|F44|F45|F46|F47|F48|F49|F4a|R177F4b|R2F4a|R1F45|F40|F3b|F36|F31|F2c|F27|F22|F1d|F18|F13|Fe|F9|R20F4}'},
        {Id: '{00000000-0000-4000-4100-000000004002}', Author: 'UltraCreation Team',
            Category_Id: Category.muscle_training.Id, Mode_Id: null, Name: 'push_ups',
            BodyParts: BodyCategory.none, Icon: 0xe947,
            Content: 'V1D16{|R1P96I3e8F32C2ee}{Rf0I500|R1P32F32|P35|P38|P3b|P3e|P41|P44|P47|P4a|P4d|P50|P53|P56|P59|P5c|P5f|P62|P65|P68|P6b|P6e|P71|P74|P77|P7a|P7d|P80|P83|P86|P89|P8c|P8f|P92|P95|P96|P93|P90|P8d|P8a|P87|P84|P81|P7e|P7b|P78|P75|P72|P6f|P6c|P69|P66|P63|P60|P5d|P5a|P57|P54|P51|P4e|P4b|P48|P45|P42|P3f|P3c|P39|P36|P33}'},
        {Id: '{00000000-0000-4000-4100-000000004003}', Author: 'UltraCreation Team',
            Category_Id: Category.muscle_training.Id, Mode_Id: null, Name: 'sit_ups',
            BodyParts: BodyCategory.none, Icon: 0xe949,
            Content: 'V1D16{|R1P96I3e8F32C2ee}{R200I600|R1P32F3cC3|P38|P3e|P44|P4a|P50|P56|P5c|P62|P68|P6e|P74|P7a|P80|P86|P8c|P92|P96}'},

        {Id: '{00000000-0000-4000-4100-0000000FF001}', Author: 'UltraCreation Team',
            Category_Id: Category.recommend.Id, Mode_Id: null, Name: 'recommend1',
            BodyParts: [Body.back], Icon: null,
            Content: inplace_files.file3_sore_therpy},
        {Id: '{00000000-0000-4000-4100-0000000FF002}', Author: 'UltraCreation Team',
            Category_Id: Category.recommend.Id, Mode_Id: null, Name: 'recommend2',
            BodyParts: [Body.back], Icon: null,
            Content: inplace_files.file11_pain_treatment},
        {Id: '{00000000-0000-4000-4100-0000000FF003}', Author: 'UltraCreation Team',
            Category_Id: Category.recommend.Id, Mode_Id: null, Name: 'recommend3',
            BodyParts: [Body.back], Icon: null,
            Content: inplace_files.file7_shoulder},
        ]

        export const DemoModes =
        {
            FRICTION: inplace_files.FRICTION,
            KNEADING: inplace_files.KNEADING,
            PRESSURE: inplace_files.PRESSURE
        }
}
