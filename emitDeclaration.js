
const { exec } = require("child_process")
const chalk = require('react-dev-utils/chalk');

//利用tsc生成 d.ts文件
export default function emitDeclaration() {
    let firseBuild = true;
    let emitCourse;

    // 开启tsc监听
    const startEmit = () => {
        emitCourse = exec(`tsc --emitDeclarationOnly`);

        emitCourse.stdout.on('data', (data) => {
            const dataStr = data.toString();
            const dataArr = dataStr.split(' ');
            if (dataArr[0] === 'error' || /error TS(\d{1,})/g.test(dataStr)) {
                console.log(chalk.red(dataStr));
            } else {
                console.log(chalk.cyan(dataStr));
            }
        });

        emitCourse.stderr.on('data', (data) => {
            errLog(`tsc编译错误: ${data}`)
        });

        emitCourse.on('close', (code) => {
            errLog(`tsc编译关闭: ${code}`)
        });
    }

    const closeEmit = () => {
        // 关闭子进程 
    }

    return {
        name: 'emit-declaration',
        buildEnd() {
            firseBuild && startEmit();
            firseBuild = false;
            return null;
        },
        closeWatcher() {
            closeEmit()
        }
    };
}
