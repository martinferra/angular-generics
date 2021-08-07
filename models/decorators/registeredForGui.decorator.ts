import { ComponentResolver } from "../component-resolver.service"

export function RegisteredForGui(classId: string, spec: any) {
    return function(classObj: Function) {
        if(!('classId' in classObj)) {
            Object.defineProperty(classObj, 'classId', {
                enumerable: false,
                get() { return classId },
                set() {}
            });
        }
        const componentResolver: ComponentResolver = ComponentResolver.getInstance()
        for (const key in spec) {
            componentResolver.setRelationship(classObj, key, spec[key])
        }
    }
}