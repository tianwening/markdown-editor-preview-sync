<template>
  <div class="container">
    <div class="editorArea" ref="editorArea"></div>
    <div class="previewArea" ref="previewArea" v-html="htmlStr"></div>
  </div>
</template>


<script setup>
import article from 'raw-loader!./article.md'
import { onMounted, ref } from "vue";
import CodeMirror from "codemirror";
import "codemirror/mode/markdown/markdown.js";
import "codemirror/lib/codemirror.css";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from 'rehype-highlight'
import "highlight.js/styles/agate.css";
import javascript from "highlight.js/lib/languages/javascript";
// CodeMirror编辑器实例
let editor = null;
// 编辑区域容器节点
const editorArea = ref(null);
// 预览区域容器节点
const previewArea = ref(null);
// markdown转换成的html字符串
const htmlStr = ref("");

let treeData = []

let editorElementList = []
let previewElementList = []

const customPlugin = () => (tree, file) => {
  treeData = tree
}


// 编辑器文本发生变化后进行转换工作
const onChange = (instance) => {
  unified()
    .use(remarkParse) // 将markdown转换成语法树
    .use(remarkRehype) // 将markdown语法树转换成html语法树，转换之后就可以使用rehype相关的插件
    .use(rehypeHighlight, {
      ignoreMissing: true,
      languages: {
        javascript
      }
    }) // 使用自定义插件
    .use(customPlugin) // 使用自定义插件
    .use(rehypeStringify) // 将html语法树转换成html字符串
    .process(instance.doc.getValue())// 输入编辑器的文本内容
    .then(
      (file) => {
        // 将转换后得到的html插入到预览区节点内
        htmlStr.value = String(file);
      },
      (error) => {
        throw error;
      }
    );
};

// 计算位置信息
const computedPosition = () => {
  const childNodes = previewArea.value.childNodes
  editorElementList = []
  previewElementList = []

  for (let i = 0; i < treeData.children.length; i++) {
    const child = treeData.children[i]
    if (child.type !== 'element') {
      continue
    }
    const scrollTop = editor.heightAtLine(child.position.start.line - 1, "local")
    editorElementList.push(scrollTop)
    previewElementList.push(childNodes[i].offsetTop)
  }

};


const onEditorScroll = () => {
  computedPosition();
  // 获取编辑器滚动信息
  let editorScrollInfo = editor.getScrollInfo();
  // 找出当前滚动到元素索引
  let scrollElementIndex = null;
  for (let i = 0; i < editorElementList.length; i++) {
    if (editorScrollInfo.top < editorElementList[i]) {
      // 当前元素的offsetTop大于滚动的距离，相当于当前滚动到了前一个元素上
      scrollElementIndex = i - 1;
      break;
    }
  }
  // 已经滚动到底部
  if (
    editorScrollInfo.top >=
    editorScrollInfo.height - editorScrollInfo.clientHeight
  ) {
    previewArea.value.scrollTop =
      previewArea.value.scrollHeight - previewArea.value.clientHeight;
    return;
  }
  if (scrollElementIndex >= 0) {
    // 设置预览区域的滚动距离为对应元素的offsetTop
    let ratio =
      (editorScrollInfo.top - editorElementList[scrollElementIndex]) /
      (editorElementList[scrollElementIndex + 1] -
        editorElementList[scrollElementIndex]);
    previewArea.value.scrollTop =
      ratio *
      (previewElementList[scrollElementIndex + 1] -
        previewElementList[scrollElementIndex]) +
      previewElementList[scrollElementIndex];
  }
};

onMounted(() => {
  // 创建编辑器
  editor = CodeMirror(editorArea.value, {
    value: article,
    mode: "markdown",
    lineNumbers: true,
    lineWrapping: true,
  });
  // 监听编辑器文本修改事件
  editor.on("change", onChange);
  editor.on("scroll", onEditorScroll);
  onChange(editor)
});

</script>

<style scoped>
.container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
}

.editorArea,
.previewArea {
  height: 100%;
  flex: 1;
}

.editorArea {
  border-right: 1px solid #ccc;
}

.previewArea {
  overflow: auto;
}

::v-deep .CodeMirror {
  height: 100%;
  font-size: 16px;
  background-color: #fafafa;
}
</style>
