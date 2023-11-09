// // Object.defineProperty
// let info  = {
//     name:'tx',
//     age:23
// }
// const obj = {
//     id:1,
//     info:info
// }

// Object.defineProperty(obj,'info',{
//     set:(newval)=>{
//         console.log('set')
//         info = newval
//     },
//     get:()=>{
//         console.log('get')
//         return info
//     }
// })
// obj.info.time=22
// console.log('----')
// obj.info = {
//     name:'tx',
//     age:23,
//     new:1
// }

// proxy
// const origin = {
//     name:'ytx',
//     age:'23',
//     count:10,
//     price:5
// }

// const proxy = new Proxy(origin,{
//     // 通过代理对象才可以触发set和get
//     set(target,key,value,recevier){
//         console.log('setter')
//         target[key] = value
//         // 被代理对象，key,新值,代理对象
//         console.log(target,key,value,recevier)
//         return true
//     },
//     get(target,key,recevier){
//         console.log('getter')
//         console.log(target,key,recevier)
//     }
// })

// proxy.new='adder'

// reflect
// const obj = {
//     firstname:'张',
//     lastname:'三',
//     // 加了get再调用时不需要再加()
//     get fullname(){
//         return this.firstname+this.lastname;
//     }
// }

// const proxy = new Proxy(obj,{
//     get(target,key,receiver){
//         console.log('getter')
//         // 返回target[key],将target的this绑定为receiver
//         Reflect.get(target, key, receiver)
//         // return target[key]
//     }
// })

// proxy.fullname

let obj = {name:'tx'}

let obj2= {name:'yh'}
let set = new Set()
set.add(obj)
set.add(obj2)
obj=null
console.log(set)

