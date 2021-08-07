import { ComponentResolver } from "../component-resolver.service"

export function AvailableForMapping(classId: string, key?: string) {
    return function(compClass: Function) {
        if(!('classId' in compClass)) {
            Object.defineProperty(compClass, 'classId', {
                enumerable: false,
                get() { return classId },
                set() {}
            });
        }
        const componentResolver: ComponentResolver = ComponentResolver.getInstance()
        componentResolver.setComponent(compClass, key)
    }
}