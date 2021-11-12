import { ClassResolver } from "../class-resolver.service"

export function WithClassId(classId: string) {
    return function(classObj: Function) {
        if(!('classId' in classObj)) {
            Object.defineProperty(classObj, 'classId', {
                enumerable: false,
                get() { return classId },
                set() {}
            });
        }
        ClassResolver.getInstance().setClass(classObj, classId);
    }
}