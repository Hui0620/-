export type Category =
  | 'emergency'
  | 'basic'
  | 'social'
  | 'number'
  | 'time'
  | 'medical'
  | 'family'
  | 'emotion'
  | 'traffic';

export interface SignItem {
  id: string;
  word: string;
  /** 拼音，用于语音转手语的分词匹配 */
  pinyin: string;
  /** 同义词 / 近义词，提升文本匹配命中率 */
  aliases?: string[];
  category: Category;
  /** 手势整体描述 */
  description: string;
  /** 动作要点 */
  tips: string[];
  /** 手形：手指状态编码，用于图示渲染 thumb-index-middle-ring-pinky: 1 伸 0 屈 */
  handshape?: string;
  /** 是否双手手势 */
  twoHanded?: boolean;
  /** 手势位置 */
  location?: string;
  /** 运动方式 */
  movement?: string;
  /** 是否可被摄像头规则识别（部分词需采集样本后用 KNN 识别） */
  recognizable?: boolean;
}

/** 中国手语手指字母（汉语手指字母方案），用于任意文字的拼音拼写兜底 */
export interface FingerLetter {
  letter: string;
  /** 手指状态：thumb,index,middle,ring,pinky  1=伸直 0=弯曲 */
  shape: [number, number, number, number, number];
  /** 手形描述 */
  description: string;
  /** 动作要点 */
  tips: string[];
}

export interface RecognizedGesture {
  sign: SignItem;
  confidence: number;
  /** 识别来源：规则引擎 / KNN 数据集 / 模板匹配 */
  source?: 'rule' | 'knn' | 'template';
}

/** 一条训练样本：归一化后的关键点特征 */
export interface SignSample {
  label: string;
  /** 63 维：右手(21*3) + 左手(21*3)，缺失侧补零 */
  features: number[];
  /** 采集时间戳 */
  ts: number;
}

export interface SignDataset {
  name: string;
  version: string;
  source: string;
  updatedAt: string;
  samples: SignSample[];
}

export interface EmergencyConfig {
  contacts: EmergencyContact[];
  message: string;
  /** Webhook 地址，支持 Server酱 / 企业微信机器人 / 自建接口 */
  webhookUrl: string;
  /** 附加定位信息 */
  includeLocation: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation?: string;
}

export interface AppSettings {
  fontSize: 'normal' | 'large' | 'extra';
  highContrast: boolean;
  voiceEnabled: boolean;
  vibrationEnabled: boolean;
  autoSpeak: boolean;
  emergency: EmergencyConfig;
  /** 摄像头分辨率，低端设备可调低以提升帧率 */
  resolution: 'low' | 'medium' | 'high';
  /** 检测置信度阈值 */
  sensitivity: number;
  /** 是否镜像画面 */
  mirror: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 'large',
  highContrast: false,
  voiceEnabled: true,
  vibrationEnabled: true,
  autoSpeak: true,
  emergency: {
    contacts: [],
    message: '我遇到紧急情况，需要帮助。这是手语即时通发出的求助信息。',
    webhookUrl: '',
    includeLocation: true,
  },
  resolution: 'medium',
  sensitivity: 0.5,
  mirror: true,
};

/** 分类元数据 */
export const CATEGORY_META: Record<Category, { label: string; color: string; icon: string }> = {
  emergency: { label: '紧急求助', color: '#ef4444', icon: 'alert-triangle' },
  basic: { label: '基础需求', color: '#0ea5e9', icon: 'heart' },
  social: { label: '社交问候', color: '#22c55e', icon: 'message-circle' },
  number: { label: '数字', color: '#8b5cf6', icon: 'hash' },
  time: { label: '时间', color: '#f59e0b', icon: 'clock' },
  medical: { label: '医疗', color: '#ec4899', icon: 'heart-pulse' },
  family: { label: '人物家庭', color: '#06b6d4', icon: 'users' },
  emotion: { label: '情绪感受', color: '#a855f7', icon: 'smile' },
  traffic: { label: '出行交通', color: '#3b82f6', icon: 'car' },
};
