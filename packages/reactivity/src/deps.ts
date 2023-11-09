import { ReactiveEffect } from "./effect"
export type Dep = Set<ReactiveEffect>
// ?表示不一定存在
export const createDep = (effects?: ReactiveEffect[]): Dep => {
    return new Set<ReactiveEffect>(effects)
}
