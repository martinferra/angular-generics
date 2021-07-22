import { ComponentResolver } from "../component-resolver.service"

export function AvailableForMapping(classId: string, key: string = null) {
    return function(compClass: Function) {
        Object.defineProperty(compClass, 'classId', {
            enumerable: false,
            get() { return classId },
            set() {}
        });
        const componentResolver: ComponentResolver = ComponentResolver.getInstance()
        componentResolver.setComponent(compClass, key)
    }
}