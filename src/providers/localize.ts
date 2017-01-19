import {Injectable}  from '@angular/core';
import {TSqliteStorage} from '../UltraCreation/Storage';
import {const_data} from './thunderbolt.const'

import {TranslateService} from "ng2-translate";

@Injectable()
export class TLocalizeService
{
    constructor (private TransSvc: TranslateService)
    {
        this.Storage = new TSqliteStorage(const_data.DatabaseName);
        this.SetDefaultTranslate();

        console.log('TLocalizeService construct');
    }

    get Languages(): string[]
    {
        return this.TransSvc.getLangs();
    }

    AddLanguage(Name: string, Translation: Object, Merge: boolean = false)
    {
        this.TransSvc.setTranslation(Name, Translation, Merge);
    }

    get Language(): string
    {
        return this.TransSvc.currentLang;
    }

    set Language(Value: string)
    {
        this.TransSvc.use(Value);
    }

    Translate(Key: string | string[]): string | string[]
    {
        return this.TransSvc.instant(Key);
    }

    private SetDefaultTranslate()
    {
        this.AddLanguage('en', translate_en);
        this.AddLanguage('zh', translate_zh);
        this.TransSvc.setDefaultLang('en');

        console.log(navigator.language);

        let codes = navigator.language.split('-');
        if (codes[0] === 'zh')
            this.Language = 'zh';
    }

    private Storage: TSqliteStorage;
}

let translate_en =
{
    hint:
    {
        e_usb_serial_plugin: "USB Device Error.",
        e_usb_permission: "We don't have the Permission to use USB Device.",
        e_ble_plugin: "BLE Device Error.",
        e_connect_timeout: "Connect Timeout.",
        e_request_timeout: "Request Timeout.",
        e_disconnected: "Device Disconnected Unexpectly.",

        min: 'Minutes',

        shutdown: 'Thunderbolt has been shutdown.',
        low_battery: 'Battery is Low, Please recharge...',
        disconnected: '',
        no_load: 'Apply all the electrodes.',
        hardware_error: 'Hardware error, Please contact Customer Service.',

        network_unavailable: 'Network Unavailable.'
    },

    button:
    {
        login: 'Login',
        logout: 'Logout',
        ok: 'Ok',
        cancel: 'Cancel',
        yes: 'Yes',
        no: 'No',
        ignore: 'Ignore',
        exit: 'Exit',
        confirm: 'Confirm',
        create: 'Create',
        read: 'Read',
        play: 'Play',
        go: 'Go',
    },

    home_page:
    {
        title: 'Thunder Bolt',
        menu_appearance: 'Skin',
        menu_agreement: 'TOU',
    },

    register_page:
    {
        agreement_html: '',
    },

    go_page:
    {
        plug_device: 'Plugin your device...',
    },

    running_page:
    {
    },

    skin_page:
    {
        title: 'Appearance',
    },

    body:
    {
        back: 'Back',
        forelimb: 'Forelimb',
        lowerlimb: 'Lowerlimb',
        abdomen: 'Abdomen',
        foot: 'Foot',
        joint: 'Joint'
    },

    category:
    {
        'null': 'No Description',

        therapy: 'Therapy',
        therapy_desc: 'Therapy',

        fat_burning: 'Fat-Burning',
        fat_burning_desc: 'Fat-Burning',

        muscle_training: 'Muscle Training',
        muscle_training_desc: 'Muscle Training',

        relax: 'Relax',
        relax_desc: 'Relax'
    },

    scriptfile:
    {
        'null': 'No Description',

    /* therpy */
        sore: 'Sore Therpy',
        sore_desc: ``,

        pain: 'Pain Treatment',
        pain_desc: ``,

        han: 'Hans Treatment',
        han_desc: ``,

    /* fat-burning */
        fb_a: 'Burning A',
        fb_b: 'Burning B',
        fb_c: 'Burning C',
        fb_d: 'Burning D',
        fb_e: 'Burning E',
        fb_f: 'Burning F',
        fb_g: 'Burning G',

    /* muscle training */
        dumbbell: 'Dumbbell Assist',
        dumbbell_desc: '',

        push_ups: 'Push-ups Simulation',
        push_ups_desc: '',

        sit_ups: 'Sit-ups Simulation',
        sit_ups_desc: '',

    /* relax */
        knock: 'Knock',
        knock_desc: '',

        press: 'Press',
        press_desc: '',

        twist: 'Twist',
        twist_desc: '',

        soft: 'Soft',
        soft_desc: '',

        joint: 'Joint',
        joint_desc: '',

        shoudler: 'Shoudler',
        shoudler_desc: '',

        upper_arm: 'Upper Arm',
        upper_arm_desc: '',

        waist: 'Waist',
        waist_desc: '',

        soles: 'Soles',
        soles_desc: '',

        leg: 'Leg',
        leg_desc: '',
    },

    agreement_page:
    {
        agree: 'Accept <b>Terms & Conditions</b>',
        terms_conditions: `<h6 color="danger"><ion-icon app-icon text-danger>&#xe900;</ion-icon> <span>禁止</span></h6>
            <ul>
                <li>不应用于未经确诊的疼痛</li>
                <li>切勿于癌症伤口上使用本产品</li>
                <li>不宜应用在肿胀，感染，发炎区或皮疹(例如静脉炎，血栓性静脉炎等)</li>
                <li>使用心脏起搏器或任何植入式心震颤去除器的患者请勿使用.心脏病患者使用前需咨询医生指引。</li>
                <li>勿靠近心脏使用。电极贴不应被放置在胸部(肋骨和胸骨附近)，尤其不可放置在兩胸大肌处。</li>
                <li>不建议贫血，癲癇及糖尿病人使用</li>
                <li>不要在怀孕期間使用本产品</li>
                <li>如果用户正连接到高频手术设备，不宜使用，可能导致皮肤灼伤</li>
                <li>禁止在头部，面部，口腔，颈项前部，靠近生殖器或內部使用</li>
                <li>严禁在睡眠期间使用本产品</li>
                <li>有除以上情形以外的身体不适人士</li>
            </ul>
            <h6 color="danger"><ion-icon text-danger>&#xf267;</ion-icon> <span>警告，注意及不良反应</span></h6>
            <ul>
                <li>注意不要过度刺激甲状腺或颈动脉，或胸部和上背部，这可能导致上呼吸道的严重肌肉痉挛，呼吸困难，或影响心律或血压</li>
                <li>不要在短波或微波治疗设备附近使用此产品，可能會影响产品输出功率</li>
                <li>切勿在湿度高环境下使用本产品，如淋浴时不宜使用</li>
                <li>请使用在清洁，已擦干，和没有损伤的皮肤区域</li>
                <li>在使用过程中，要保持电极贴分隔开，贴片互相接触，可能会导致过度的刺激或灼伤皮肤</li>
                <li>请将仪器放在儿童不能接触的位置</li>
                <li>此仪器不宜由没有自制能力，情绪不安，老年痴呆症，或低智商的病人操作</li>
                <li>驾驶中，靠近水，或在任何肌肉收缩的运动过程中均不可使用本产品，否则可能受伤</li>
                <li>使用本产品時，不可靠近任何高度易燃物质，气体或爆炸物</li>
                <li>使用过程中需将电极贴尽量远离金属物体如皮带扣、项链等等</li>
                <li>移除电极贴前先关产品电源</li>
                <li>只可選用由供应商提供电极贴</li>
                <li>如果出现皮肤敏感，请停用本产品</li>
            </ul>`,
    }
}

let translate_zh =
{
    hint:
    {
        e_usb_serial_plugin: "USB 设备错误。",
        e_usb_permission: "请授予权限使用USB",
        e_ble_plugin: "BLE 设备错误。",
        e_connect_timeout: "未能成功连接上设备。",
        e_request_timeout: "请求超时。",
        e_disconnected: "设备意外断开。",

        min: '分钟',

        shutdown: '设备已关机。',
        low_battery: '电池电量低，请充电',
        disconnected: '设备已断开。',
        no_load: '请检查电极帖',
        hardware_error: 'Hardware error, Please contact Customer Service.',

        network_unavailable: '无网络'
    },

    button:
    {
        login: '登录',
        logout: '登出',
        ok: '确定',
        cancel: '取消',
        yes: '是',
        no: '否',
        ignore: '无视',
        exit: '退出',
        confirm: '了解了',
        create: '创建',
        read: '看看',
    },

    home_page:
    {
        title: 'Thunder Bolt',
        menu_appearance: '选择外观',
        menu_agreement: '使用条款',
    },

    go_page:
    {
        plug_device: '请插入您的设备...',
    },

    running_page:
    {
    },

    skin_page:
    {
        title: '选择外观',
    },

    body:
    {
        back: '背部',
        forelimb: '手部',
        lowerlimb: '腿部',
        abdomen: '腹部',
        foot: '脚底',
        joint: '关节'
    },

    category:
    {
        'null': '无描述',

        therapy: '治疗',
        fat_burning: '瘦身',
        muscle_training: '健美',
        relax: '放松'
    },

    scriptfile:
    {
        'null': '无描述',

    /* THRIPY */
        sore: '酸痛冶疗',
        sore_desc: '用于肌肉酸痛症状的缓解。',

        pain: '疼痛冶疗',
        pain_desc: '较重的手法，对肌肉疼痛症状有缓解作用。',

        han: '疼痛缓解',
        han_desc: '模防按模师搓揉和敲打效果的混合, 以3秒的间隔的两次搓揉和敲打起到了自然的镇痛作用。',

    /* fat-burning */
        fb_a: '燃烧脂肪 A',
        fb_b: '燃烧脂肪 B',
        fb_c: '燃烧脂肪 C',
        fb_d: '燃烧脂肪 D',
        fb_e: '燃烧脂肪 E',
        fb_f: '燃烧脂肪 F',
        fb_g: '燃烧脂肪 G',

    /* muscle training */
        dumbbell: '辅助哑呤',
        push_ups: '俯卧撑',
        sit_ups: '仰卧起坐',

    /* relax */
        knock: '敲打',
        knock_desc: '模仿敲击捶打的手法，有节奏的循环对放松肌肉有不错的效果。',

        press: '按压',
        press_desc: '模仿按压的手法，对如肩、腰、背各部位的肌肉紧张有缓解效果。',

        twist: '搓揉',
        twist_desc: '针对腰部肌肉群的特定手法，对久坐和运动造成的腰肌劳损有舒缓作用。',

        soft: '肌肉放松',
        soft_desc: '较轻柔的按摩手法，适合承受力较低的用户。有助于日常缓解肌肉紧张。',

        joint: '关节舒展',
        joint_desc: '针对关节部位的特定手法，对爬山、跑步、举重等关节部位高强度活动后的恢复有辅助作用。',

        shoudler: '肩部舒展',
        shoudler_desc: '针对肩部肌肉群的特定手法，有助于缓解颈肩部位的劳损症状。',

        upper_arm: '上臂按摩',
        upper_arm_desc: '针对手臂部位的肌肉群的特定的放松手法，适合于如羽毛球、俯卧撑、抓举攀爬类运动后的恢复。',

        waist: '腰部按摩',
        waist_desc: '针对腰部肌肉群的特定手法，对久坐和运动造成的腰肌劳损有舒缓作用。',

        soles: '脚部按摩',
        soles_desc: '模仿脚底按摩的手法，对穴位进行刺激。',

        leg: '腿部按摩',
        leg_desc: '用于腿部肌肉的放松, 适合于跑步, 爬山, 自行车运动后的恢复',
    },

    agreement_page:
    {
        agree: '我已阅读并接受使用条款',
        terms_conditions: `<h6 class="text-danger"><i class="app-icon">&#xe900;</i><span>禁止</span></h6>
            <ul>
                <li>不应用于未经确诊的疼痛</li>
                <li>切勿于癌症伤口上使用本产品</li>
                <li>不宜应用在肿胀，感染，发炎区或皮疹(例如静脉炎，血栓性静脉炎等)</li>
                <li>使用心脏起搏器或任何植入式心震颤去除器的患者请勿使用.心脏病患者使用前需咨询医生指引。</li>
                <li>勿靠近心脏使用。电极贴不应被放置在胸部(肋骨和胸骨附近)，尤其不可放置在兩胸大肌处。</li>
                <li>不建议贫血，癲癇及糖尿病人使用</li>
                <li>不要在怀孕期間使用本产品</li>
                <li>如果用户正连接到高频手术设备，不宜使用，可能导致皮肤灼伤</li>
                <li>禁止在头部，面部，口腔，颈项前部，靠近生殖器或內部使用</li>
                <li>严禁在睡眠期间使用本产品</li>
                <li>有除以上情形以外的身体不适人士</li>
            </ul>
            <h6 class="text-danger"><i class="ion-icon">&#xf267;</i> <span>警告，注意及不良反应</span></h6>
            <ul>
                <li>注意不要过度刺激甲状腺或颈动脉，或胸部和上背部，这可能导致上呼吸道的严重肌肉痉挛，呼吸困难，或影响心律或血压</li>
                <li>不要在短波或微波治疗设备附近使用此产品，可能會影响产品输出功率</li>
                <li>切勿在湿度高环境下使用本产品，如淋浴时不宜使用</li>
                <li>请使用在清洁，已擦干，和没有损伤的皮肤区域</li>
                <li>在使用过程中，要保持电极贴分隔开，贴片互相接触，可能会导致过度的刺激或灼伤皮肤</li>
                <li>请将仪器放在儿童不能接触的位置</li>
                <li>此仪器不宜由没有自制能力，情绪不安，老年痴呆症，或低智商的病人操作</li>
                <li>驾驶中，靠近水，或在任何肌肉收缩的运动过程中均不可使用本产品，否则可能受伤</li>
                <li>使用本产品時，不可靠近任何高度易燃物质，气体或爆炸物</li>
                <li>使用过程中需将电极贴尽量远离金属物体如皮带扣、项链等等</li>
                <li>移除电极贴前先关产品电源</li>
                <li>只可選用由供应商提供电极贴</li>
                <li>如果出现皮肤敏感，请停用本产品</li>
            </ul>`,
    }
}
