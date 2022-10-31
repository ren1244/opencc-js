此分支為介紹用（正式的程式碼在 main 分支），以下介紹這次修改的內容

## 發揮 ES6 的 Tree Shaking 特性

這個版本和原先版本一樣，在 node 中可以透過 `import` 引用 opencc-js

```javascript
import * as OpenCC from 'opencc-js';

const converter = OpenCC.Converter({from: 'tw', to: 'cn'});
console.log(converter('漢語'));
```

但如果把這樣的程式碼打包，出來的檔案是包含所有的字典資料，檔案較大。

在這個版本，重新設計了結構，允許使用者使用模組較底層的元件打包出較小的檔案。只要改用下列寫法，打包工具就能使用 Tree Shaking 讓檔案只匯出需要的的部分。

```javascript
//這段程式用 rollup 打包出來大小不到 100k。
import * as OpenCC from 'opencc-js/core'; //核心程式碼，相當以前的 main.js
import * as Locale from 'opencc-js/preset'; //預設的字典資料，相當於以前那些 data

const converter = OpenCC.ConverterFactory(Locale.from.tw, Locale.to.cn);
console.log(converter('漢語'));
```

值得注意的是：雖然 `opencc-js/preset` 包含了全部的資料，但打包時會自動移除沒用到的部分。Tree Shaking 之後相當於下列程式碼

```javascript
import * as OpenCC from 'opencc-js/core';
import locFromTw from 'opencc-js/from/tw';
import locToCn from 'opencc-js/to/cn';

const converter = OpenCC.ConverterFactory(locFromTw, locToCn);
console.log(converter('漢語'));
```

## 瀏覽器環境的 es6 import

原先版本在瀏覽器的使用只提供了 umd 格式，透過 `<script src="...">` 引用。

這個版本允許使用者在 `<script type="module">` 標籤內，直接 `import` dist/esm 資料夾內的模組。

```html
<script type="module">
  import * as OpenCC from './dist/esm/core.js';
  import locFromTw from './dist/esm/from/tw.js';
  import locToCn from './dist/esm/to/cn.js';

  const converter = OpenCC.ConverterFactory(locFromTw, locToCn);
  console.log(converter('漢語'));
</script>
```

因為瀏覽器不會 Tree Shaking，所以下列用 preset 載入 data 的方式不推薦，會載入多餘的資料。

```html
<script type="module">
  import * as OpenCC from './dist/esm/core.js';
  import * as Locale from './dist/esm/preset/t2cn.js'; //視情況可用 cn2t.js 或 full.js

  const converter = OpenCC.ConverterFactory(Locale.from.tw, Locale.to.cn);
  console.log(converter('漢語'));
</script>
```

## 字典的表達方式

原先版本在 `.CustomConverter` 使用二維陣列表達字詞替換的字典，內建 data 卻使用「『空白』與『|』作為分隔符的字串」作為字典。在這個版本把它們都當作是一樣的東西，彼此可以互相替換。

```javascript
/**
 * 以下兩者是等同的
 * 任何函式能接受其中一個作為參數
 * 就一定能用另一種寫法
 */
const myDict1 = [
  ['香蕉', '🍌️'],
  ['蘋果', '🍎️'],
  ['梨', '🍐️'],
];

const myDict2 = '香蕉 🍌️|蘋果 🍎️|梨 🍐️';
```

## 允許在預設字典中新增內容

原先版本自訂字詞只能透過 `.CustomConverter` 作額外的轉換，這個版本允許把自訂字詞添加到預設的字典內。

```javascript
import * as OpenCC from 'opencc-js';
import * as Locale from 'opencc-js/preset';

//自訂字典
const myDict = [
    ['yyds', '永遠的神']
];

//把 Locale.from.cn 與自訂字典合併
const mergedDictGroup = Array.from(Locale.from.cn); //copy Locale.from.cn to mergedDictGroup
mergedDictGroup.push(myDict); //add custom Dict

const converter = OpenCC.ConverterFactory(mergedDictGroup, Locale.to.tw);
console.log(converter('汉语yyds')); //output: "漢語永遠的神"
```

另外 `.ConverterFactory` 也允許給予多個參數，達到「先用預設轉換器，再用自訂轉換器」的效果

```javascript
import * as OpenCC from 'opencc-js';
import * as Locale from 'opencc-js/preset';

//自訂字典
const myDict = [
    ['yyds', '永遠的神']
];

const newDictGroup = [myDict]

//等同於以前用預設資料轉換後，再用 CustomConvert 再轉一次
const converter = OpenCC.ConverterFactory(Locale.from.cn, Locale.to.tw, newDictGroup);
console.log(converter('汉语yyds')); //output: "漢語永遠的神"
```

## 從原先版本遷移

以下是改動之處

### 瀏覽器引入 umd javascript

以下三選一即可

```html
<script src="dist/umd/cn2t.js"></script>
<script src="dist/umd/t2cn.js"></script>
<script src="dist/umd/full.js"></script>
```

### 瀏覽器使用 es6 import 時

不支援舊的 `.Converter` 函數，建議用 `ConverterFactory`

如果仍然很想用 `.Converter`，參考下列寫法

```html
<script type="module">
  import * as OpenCC from './dist/esm/core.js';
  import * as Locale from './dist/esm/preset/t2cn.js';

  //製造缺少的 Converter 函數
  const Converter = OpenCC.ConverterBuilder(Locale);

  const converter = Converter({form: 'tw', to: 'cn'});
  console.log(converter('漢語'));
</script>
```