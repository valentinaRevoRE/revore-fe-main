import { EStates } from "@shared/enums/states.enum";

export interface IToast {
    message: string;
    isOpen: boolean;
    type: EStates;
    time?: number
}