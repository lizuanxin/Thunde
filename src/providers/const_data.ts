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
            Icon: 0xE91A, Desc: JSON.stringify([0xE946, 0xE932])},
        {Id: '{00000000-0000-4000-2000-000000000003}', Name: 'back',
            Icon: 0xE904, Desc: JSON.stringify([0xE943])},
        {Id: '{00000000-0000-4000-2000-000000000004}', Name: 'waist',
            Icon: 0xE915, Desc: JSON.stringify([0xE9FD])},
        {Id: '{00000000-0000-4000-2000-000000000005}', Name: 'upperarm',
            Icon: 0xE903, Desc: JSON.stringify([0xE9A4])},
        {Id: '{00000000-0000-4000-2000-000000000006}', Name: 'elbow',
            Icon: 0xE90E, Desc: JSON.stringify([0xE970])},
        {Id: '{00000000-0000-4000-2000-000000000007}', Name: 'forearm',
            Icon: 0xE910, Desc: JSON.stringify([0xEA14])},
        {Id: '{00000000-0000-4000-2000-000000000008}', Name: 'wrist',
            Icon: 0xE920, Desc: JSON.stringify([0xE95b])},
        {Id: '{00000000-0000-4000-2000-000000000009}', Name: 'abdomen',
            Icon: 0xE900, Desc: JSON.stringify([0xE959])},
        {Id: '{00000000-0000-4000-2000-00000000000A}', Name: 'buttock',
            Icon: 0xE905, Desc: JSON.stringify([0xE91A])},
        {Id: '{00000000-0000-4000-2000-00000000000B}', Name: 'thigh',
            Icon: 0xE91D, Desc: JSON.stringify([0xe915])},
        {Id: '{00000000-0000-4000-2000-00000000000C}', Name: 'knee',
            Icon: 0xE913, Desc: JSON.stringify([0xEA25])},
        {Id: '{00000000-0000-4000-2000-00000000000D}', Name: 'calf',
            Icon: 0xE906, Desc: JSON.stringify([0xEA58])},
        {Id: '{00000000-0000-4000-2000-00000000000E}', Name: 'ankle',
            Icon: 0xE902, Desc: JSON.stringify([0xE9B9])},
        {Id: '{00000000-0000-4000-2000-00000000000F}', Name: 'foot',
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
        {Id: '{00000000-0000-4000-3000-FFFFFFFFFFFF}', Icon: 0xe94b, Name: 'recommend'},
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
            Content: 'V1D16{|R1I28aP64F36C3|I3c0|I38e|I35c|I32a|I2f8|I2c6|I294|I262|I230|I1fe|I1cc|I19a|I168|I136|I104}{R13|R2Id2P64F36C3|Ia0|Id2|R1I104|I136|I168|I19a|I1cc|I1fe|I230|I262|I294|I2c6|I2f8|I32a|I35c|I38e|I3c0|I35c|I2f8|I294|I230|I1cc|I168|I104|R2Ia0|R1I104|I168|I1cc|I230|I294|I2f8|I35c|I3c0|I32a|I294|I1fe|I168|R2Id2|R1I168|I1fe|I294|I32a|I3c0|I35c|I2f8|I294|I230|I1cc|I168|I104|R2Ia0|R1I104|I168|I1cc|I230|I294|I2f8|I35c|I3c0|I38e|I35c|I32a|I2f8|I2c6|I294|I262|I230|I1fe|I1cc|I19a|I168|I136|I104}'},
        {Id: '{00000000-0000-4000-4100-0000000FF002}', Author: 'UltraCreation Team',
            Category_Id: Category.recommend.Id, Mode_Id: null, Name: 'recommend2',
            BodyParts: [Body.back], Icon: null,
            Content: 'V1D16{|R1I64P64F4b0C9|Ic1}{|R1I250P64F4b0C4|Ic1C9|}{|R1I24cP64F3e0C9|Ic1F4b0|}{|R1I251P64F3e0C3|Ic1F4b0C9|}{|R1I1b6P64F398C9|Ic1F4b0|}{|R1I1b6P64F4b0C3|Ic1C9|}{|R1I1b6P64F4b0C9|Ic1|}{|R1I1b7P64F4b0C9|Ic2|}{|R1I1e6P64F4b0C9|I93}{|R1I14fP64F4b0C6|I93C9|}{|R1I152P64F4b0C2|I93C9|}{|R1I14eP64F4b0C9|I93|}{|R1I150P64F4b0C2|I6fC6|}{|R1I17cP64F4b0C6|I6f}{|R1I17cP64F4b0C6|I6f}{|R1I109P64F4b0C4|I6fC6|}{|R1I17aP64F3b6C6|I6fF4b0}{|R1I17bP64F4b0C6|I6f}{|R1I108P64F4b0C5|I6fC6|}{|R1Ia6P64F4b0C3|I6fC6|}{|R1I116P64F4b0C6|I6f}{|R1I116P64F4b0C6|I6f}{|R1Ia4P64F4b0C6|I6f|}{|R1Ia5P64F4b0C4|I6fC6|}{|R1Ia8P64F4b0|I6fC6|}{|R1I117P4F4b0|I6eP64C6|Icd|I26C5|Id6|I25C4|C5|Id7|I26C2|I25C5|Ife|I26|Iff|I26|Iff|I26|Iff|I26|Id7|R2I26|R1Id8|I25C2|C5|Ife|I25|I100|I25|Icd|I25|Icd|I25|Ia4|R2I26|R1Ia5|R2I26|R1Ia8|R2I26|R1Icd|I25|Icd|I25|Icd|I25|Icd|I25|Ia4}{R1c|R2I25P64F4b0C5|R1I96}{|R1IfaP4F4b0|R6I6fP64C6|R1IfaP4C1|R6I6fP64C7|R1IfaP4C1|R6I6fP64C8|R1IfaP4C1|R6I6fP64C9|R1IfaP4C1|R6I6fP64Ca|R1IfaP4C1|R6I6fP64Cb|R1IfaP4C1}{R3I154|RbI3cP64F4b0C7}{R8I113|R9I2fP64F4b0C6}{R16I384|R6I6P4F4b0C4|P6|P8|Pa|Pc|Pe|P10|P12|P14|P16|P18|P1a|P1c|P1e|P20|P22|P24|P26|P28|P2a|P2c|P2e|P30|P32|P34|P36|P38|P3a|P3c|P3e|P40|P42|P44|P46|P48|P4a|P4c|P4e|P50|P52|P54|P56|P58|P5a|P5c|P5e|P60|P62|R2fP64|R6P62|P60|P5e|P5c|P5a|P58|P56|P54|P52|P50|P4e|P4c|P4a|P48|P46}{R1eI118|R5I2fP64F4b0C5}{R1eI118|R6I2fP64F4b0C6}{|R1I3cP4F4b0C7|P6|P8|Pa|Pc|Pe|P10|P12|P14|P16|P18|P1a|P1c|P1e|P20|P22|P24|P26|P28|P2a|P2c|P2e|P30|P32|P34|P36|P38|P3a|P3c|P3e|P40|P42|P46|P48|P4a|P4c|P4e|P50|P52|P54|P56|P5a|P5e|P60|P64}{|R1I3cP4F4b0C7|P6|P8|Pa|Pc|Pe|P10|P12|P14|P16|P18|P1a|P1c|P1e|P20|P22|P24|P26|P28|P2a|P2c|P2e|P30|P32|P34|P36|P38|P3a|P3c|P3e|P40|P42|P46|P48|P4a|P4c|P4e|P50|P52|P54|P56|P5a|P5e|P60|P64}{|R1I55P4F4b0C7|P7|Pa|Pd|P10|P13|P16|P19|P1c|P1f|P21|P23|P26|P29|P2b|P2e|P31|P34|P37|P3a|P3d|P40|P43|P46|P49|P4c|P4f|P52|P55|P58|P5b|P5d|P61|P64}{|R1I6ePaF4b0C6|Pf|P14|P1e|P28|P2a|P2d|P2f|P31|P34|P37|P3a|P3d|P40|P43|P46|P4a|P4d|P50|P53|P56|P58|P5b|P5e|P61|P64}{|R1I96PaF4b0C9|Pf|P14|P19|P1e|P23|P28|P2d|P32|P37|P3c|P41|P46|P4b|P50|P55|P5a|P5f|P64}{|R1Ic2P4F4b0C9||||Pa|Pf|P14|P1e|P28|P32|P3c|P46|P50|P5a|P64}{|R1If6P4F4b0Cc|Pa|Pf|P14|P1e|P28|P32|P3c|P46|P50|P5a|P64}{|R1I132PaF4b0Cf|P14|P1e|P28|P32|P3c|P46|P50|P5a|P64}{|R1I186PaF4b0Ce|P14|P1e|P28|P3c|P50|P64}{|R1I1daPaF4b0C11|P14|P28|P3c|P50|P64}{|R1I28aP64F4b0C16|||}{|R1I33aP64F4b0C14|||}<S1S2S3S4S5S6S7S8S9S10S11S12S13S14S15S16S17S18S19S20S21S22S23S24S25S26S27S28S29S30S31S32S33S34S35S36S37S38S39S40S41S42S43S44S45S1S2S3S4S5S6S7S8S9S10S11S12S13S14S15S16S17S18S19S20S21S22S23S24S25S26S27S28S29S30S31S32S33S34S35S36S37S38S39S40S41S42S43S44S45S1S2S3S4S5S6S7S8S9S10S11S12S13S14S15S16S17S18S19S20S21S22S23S24S25S26S27S28S29S30S31S32S33S34S35S36S37S38S39S40S41S42S43S44S45S1S2S3S4S5S6S7S8S9S10S11S12S13S14S15S16S17S18S19S20S21S22S23S24S25S26S27S28S29S30S31S32S33S34S35S36S37S38S39S40S41S42S43S44S45S1S2S3S4S5S6S7S8S9S10S11S12S13S14S15S16S17S18S19S20S21S22S23S24S25S26S27S28S29S30S31S32S33S34S35S36S37S38S39S40S41S42S43S44S45>'},
        {Id: '{00000000-0000-4000-4100-0000000FF003}', Author: 'UltraCreation Team',
            Category_Id: Category.recommend.Id, Mode_Id: null, Name: 'recommend3',
            BodyParts: [Body.back], Icon: null,
            Content: 'V1D16{|R1P64F1C2|Tb|TfC3|T15C4|T19C5|T1fC6|T25C7|F5C8|T25C7|T1fC6|T19C5|T15C4|TfC3|TbC2|F1|Tb|TfC4|T15C5|T19C6|T1fC7|T25C8|F5C9|P8T41C1|P14|P22|P8|P14|P20|P4|P10|P1e|P4|Pe|P1a|P26|P6T55|P10|P14|P24|P4|Pe|P18|P20|P4|Pa|P14|P1e|P26|P8|P14|P1a|P24}{R2I406|R1P8Fb|Pc|P10|P16|P1e|P24|P28|P2c|P30|P34|P38|P3c|P40|P44|P48|P4c|P50|P54|P58|P5c|P60|P64||||||||||||||||||||||}{R2I406|R1P6T9a|Pc|P10|P14|P18|P1c|P20|P24|P28|P2c|P30|P34|P38|P3c|P40|P44|P48|P4a|P4c|P50|P54|P56|P58|P5c|P5e|P60|P64|||||||||||||||||||||||||||||||||||}{R2I406|R1P4Tbf|P7|Pa|Pd|P10|P13|P16|P19|P1c|P1f|P22|P25|P28|P2b|P2e|P31|P34|P37|P3a|P3d|P40|P43|P46|P49|P4c|P4f|P52|P55|P58|P5b|P5e|P61|P64|||||||||||||||||||||||||||||||||||||||||||}{R2I406|R1P4T9a|P7|Pa|Pd|P10|P13|P16|P19|P1c|P1f|P22|P25|P28|P2b|P2e|P31|P34|P37|P3a|P3d|P42|P47|P4c|P51|P56|P5b|P64|||||||||||||||||||||||||||||||||||}{|R1P4Fb|P8|Pa|P10|P16|P1a|P20|P26|P2e|P30|P36|P3c|P40|P44|P4a|P50|P54|P64C11|P4T55C1|Pa|P14|P1c|P26|P2e|P3a|P40|P4a|P56|P5a|P64Ce|P6T41C1|P14|P20|P2c|P36|P42|P50|P5c|P64Cc|P4T55C1|Pc|P12|P1e|P24|P30|P36|P40|P4a|P52|P5c|P64Ce|P4FbC1|P8|Pa|P10|P14|P1a|P20|P28|P2c|P32|P36|P3c|P40|P44|P4a|P4e|P56|P64C11|P8T55C1|P10|P1a|P24|P2c|P36|P40|P48|P50|P5a|P64C10|P4T41C1|P10|P1c|P28|P34|P40|P4c|P58|P64Cc|P6FbC1|Pa|P12|P16|P1a|P20|P24|P2a|P2e|P36|P3c|P40|P46|P4a|P50|P54|P64C12|P8T55C1|P10|P1a|P24|P2c|P36|P3e|P46|P52|P5a|P64Cf}{|R10I13dP64FbC3|I12fT9aC4|I12cF13C5|I12fT9aC4|I13dFbC3|R1I0P4T55C1|Pa|P14|P1e|P24|P6|P10|P1a|P22|P4|Pe|P16|P1e|P4|Pa|P14|P1e|P26|PaT41|P1a|P24|P8|P14|P1e|P4|P10|P1e|P4|Pe|P1a|P28|P64F5C7|F4C6|T1fC5|T19C4|T15C3|TbC2|F1}<S1S2S3S4S5S6S7S1S2S3S4S5S6S7S1S2S3S4S5S6S7S1S2S3S4S5S6S7S1S2S3S4S5S6S7S1S2S3S4S5S6S7S1S2S3S4S5S6S7>'},
        ]

        export const DemoModes =
        {
            FRICTION: 'V1D16{|R1194P1eF64}',
            KNEADING: 'V1D16{R6I3f2|R8P4F96|P6|P8|Pa|Pc|Pe|P10|P12|P14|P16|P18|P1a|P1c|P1e|P20|P22|P24|P26|P28|P2a|P2c|P2e|P30|P32|P34|P36|P38|P3a|P3c|P3e|P40|P42|P44|P46|P48|P4a|P4c|P4e|P50|P52|P54|P56|P58|P5a|P5c|P5e|P60|P62|P64|P66|P68|P6a|P6c|P6e|P70|P72|P74|P76|P78|P7a|P7c|P7e|P80|P82|P84|P86|P88|P8a|P8c|P8e|P90|P92|P94|R14P96|R9P94|P92|P90|P8e|P8c|P8a|P88|P86|P84|P82|P80|P7e|P7c|P7a|P78|P76|P74|P72|P70|P6e|P6c|P6a|P68|P66|R14P64|R9P66|P68|P6a|P6c|P6e|P70|P72|P74|P76|P78|P7a|P7c|P7e|P80|P82|P84|P86|P88|P8a|P8c|P8e|P90|P92|P94|R14P96|R9P94|P92|P90|P8e|P8c|P8a|P88|P86|P84|P82|P80|P7e|P7c|P7a|P78|P76|P74|P72|P70|P6e|P6c|P6a|P68|P66|R14P64|R9P66|P68|P6a|P6c|P6e|P70|P72|P74|P76|P78|P7a|P7c|P7e|P80|P82|P84|P86|P88|P8a|P8c|P8e|P90|P92|P94|R16P96|R9P94|P92|P90|P8e|P8c|P8a|P88|P86|P84|P82|P80|P7e|P7c|P7a|P78|P76|P74|P72|P70|P6e|P6c|P6a|P68|P66|R19P64}',
            PRESSURE: 'V1D16{|R1P64F5C9|T25C8|T20C6|T19C5|T15C4|TfC3|TbC2|F1|Tb|TdC1|TfC3|T15C4|T19C5|T20C6|T25C8|F5Ca|T25C7|T20|T19C4|T15|TfC3|TbC2|F1|TbC3|Tf|T15C4|T19C5|T20C6|T25C8}{|R10If0P64TbfC5|IdcTfbC7|If0T147C8|IdcTfbC7|If0TbfC4}'
        }
}
