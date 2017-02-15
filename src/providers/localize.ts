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
        this.TransSvc.setDefaultLang('zh');

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
        e_ota_failure: 'Firmware upgrade failure.',
        e_invalid_file: 'Invalid File.',

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
        upper_back: 'Upper back',
        shoulder: 'Shoulder',
        back: 'Back',
        lower_back: 'Lower back',
        upper_arm: 'Upper arm',
        elbow: 'Elbow',
        forearm: 'Forearm',
        wrist: 'Wrist',
        abdomen: 'Abdomen',
        buttock: 'Buttock',
        thigh: 'Thigh',
        knee: 'Knee',
        calf: 'Calf',
        ankle: 'Ankle',
        foot: 'Foot',
    },

    category:
    {
        therapy: 'Therapy',
        fat_burning: 'Fat-Burning',
        muscle_training: 'Muscle Training',
        relax: 'Relax',
    },

    scriptfile:
    {
    /* therpy */
        sore: 'Sore Therpy',
        pain: 'Pain Treatment',
        han: 'Hans Treatment',

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
        push_ups: 'Push-ups Simulation',
        sit_ups: 'Sit-ups Simulation',
    /* relax */
        knock: 'Knock',
        press: 'Press',
        twist: 'Twist',
        soft: 'Soft',
        joint: 'Joint',
        shoudler: 'Shoudler',
        upper_arm: 'Upper Arm',
        waist: 'Waist',
        soles: 'Soles',
        leg: 'Leg',
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
                <li>不要在短波或微波冶疗设备附近使用此产品，可能會影响产品输出功率</li>
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
        e_ota_failure: '升级固件失败。',
        e_invalid_file: '模式文件不正确。',

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
        upper_back: '颈部',
        shoulder: '肩部',
        back: '背部',
        lower_back: '腰部',
        upper_arm: '上臂',
        elbow: '手肘',
        forearm: '手臂',
        wrist: '手腕',
        abdomen: '腹部',
        buttock: '腚部',
        thigh: '大腿',
        knee: '膝盖',
        calf: '小腿',
        ankle: '脚踝',
        foot: '足底',
    },

    category:
    {
        therapy: '冶疗',
        fat_burning: '瘦身',
        muscle_training: '健美',
        relax: '放松'
    },

    scriptfile:
    {
    /* THRIPY */
        sore: '酸痛冶疗',
        pain: '疼痛冶疗',
        han: '疼痛缓解',

    /* fat-burning */
        fb_a: '燃烧脂肪 A',
        fb_b: '燃烧脂肪 B',
        fb_c: '燃烧脂肪 C',
        fb_d: '燃烧脂肪 D',
        fb_e: '燃烧脂肪 E',
        fb_f: '燃烧脂肪 F',
        fb_g: '燃烧脂肪 G',

    /* muscle training */
        dumbbell: '哑呤',
        push_ups: '俯卧撑',
        sit_ups: '仰卧起坐',

    /* relax */
        knock: '敲打',
        press: '按压',
        twist: '搓揉',
        soft: '肌肉放松',
        joint: '关节舒展',
        shoudler: '肩部按摩',
        upper_arm: '上臂按摩',
        waist: '腰部按摩',
        soles: '足底按摩',
        leg: '腿部按摩',
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
                <li>不要在短波或微波冶疗设备附近使用此产品，可能會影响产品输出功率</li>
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
