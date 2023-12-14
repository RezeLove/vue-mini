export const enum ShapeFlags {
    ELEMENT = 1,
    // <<是左移运算（零填充）一个或多个零数位从右被推入，最左侧的数位被移除
    // 例如5<<1 5是00000101 填入一个0：0（剥离）|00001010（填入）= 10
    // 那么1<<n 相当于2的n次幂
    // 2
    FUNCTIONAL_COMPONENT = 1 << 1,
    // 4
    STATEFUL_COMPONENT = 1 << 2,
    // 8
    TEXT_CHILDREN = 1 << 3,
    // 16
    ARRAY_CHILDREN = 1 << 4,
    SLOTS_CHILDREN = 1 << 5,
    TELEPORT = 1 << 6,
    SUSPENSE = 1 << 7,
    COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
    COMPONENT_KEPT_ALIVE = 1 << 9,
    COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
