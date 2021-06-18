declare module "*.less"{
    const content: {
        [propName: string]: any
    };
    export default content;
}

declare module "*.svg" {
    const content: any;
    export default content;
} 