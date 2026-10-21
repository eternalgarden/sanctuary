export class UserSettings {
    isGbobKnown: boolean
    angelicInterventionCount: number
    /* camera */
    cameraSpeed: number
    cameraSmoothing: number
    textScaling: number
    resolutionWidth: number
    resolutionHeight: number
    useVSync: boolean
    useFullRefreshRate: boolean
    useSupersampling: boolean
    /* movement */
    useSlowWalkToggle: boolean
    /* sound */
    isSoundMuted: boolean
    generalVolume: number
    musicVolume: number
    soundEffectVolume: number
}

export type UserSettingsKey = keyof UserSettings
