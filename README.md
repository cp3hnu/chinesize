# chinesize
汉化 HTML、Angular、React 项目 

## 安装

```sh
$ npm install chinesize -g
```

## 使用

```sh
$ chinesize --help
Usage: chinesize [options] [command]

CLI to convert English Angular project to Chinese

Options:
  -V, --version            output the version number
  -h, --help               display help for command

Commands:
  extract [options] <dir>  Extract English texts of Angular project
  replace [options] <dir>  Replace English texts of Angular project to Chinese
  help [command]           display help for command
```

chinesize 提供了两个子命令：

- `extract`：提取代码里的英文文本
- `replace`：将代码里的英文文本替换成中文文本

### 提取

```sh
$ chinesize help extract
Usage: chinesize extract <dir> [options]

Extract English texts of Angular project

Arguments:
  dir                      directory of Angular project

Options:
  -t, --type <type>        file type (choices: "html", "ts")
  -o, --output <filePath>  path of file for writing the extracted English text
  -h, --help               display help for command
```



### 翻译

### 替换
