# AO3 论坛样式使用说明

## 步骤 1：创建 Work Skin

1. 登录 AO3 后，点击右上角你的用户名
2. 在左侧菜单中找到 "Skins" -> "Create Work Skin"
3. 给 Skin 起个名字，比如 "论坛样式" 或 "Forum Style"
4. 打开 `AO3_论坛样式_WorkSkin_CSS.txt` 文件
5. 复制所有 CSS 代码到 "CSS" 文本框中
6. 点击 "Submit" 保存

## 步骤 2：在作品中使用

1. 创建新作品或编辑现有作品
2. 在作品编辑页面，找到 "Select Work Skin" 下拉菜单
3. 选择你刚才创建的 Skin（比如 "论坛样式"）
4. 在 "Work Text" 编辑器中，点击 "HTML" 按钮切换到 HTML 模式
5. 打开 `AO3_论坛样式_HTML模板.html` 文件
6. 复制 HTML 代码到编辑器中
7. 修改内容：
   - 修改帖子标题
   - 修改作者信息（用户名、头衔、身份等）
   - 修改帖子正文内容
   - 添加或删除回复
   - 修改回复内容

## 自定义说明

### 修改头像
将 `<div class="forum-avatar">A</div>` 中的字母改为用户名首字母

### 修改颜色
如果需要修改颜色，编辑 Work Skin 中的 CSS：
- 金色（用户名、边框）：`#C9AA71`
- 紫色（头衔）：`rgba(139, 92, 246, 0.3)` 和 `#a78bfa`
- 蓝色（身份）：`rgba(59, 130, 246, 0.3)` 和 `#60a5fa`
- 背景色：`#0A1428` 和 `#1a1a2e`

### 添加回复
复制回复的 HTML 结构：
```html
<div class="forum-reply">
  <div class="forum-reply-header">
    <div class="forum-reply-avatar">X</div>
    <div class="forum-reply-meta">
      <span class="forum-reply-floor">#楼层号</span>
      <span class="forum-reply-username">用户名</span>
      <!-- 其他信息 -->
    </div>
  </div>
  <div class="forum-reply-content">
    <p>回复内容</p>
  </div>
</div>
```

### 添加图片
使用标准的 `<img>` 标签：
```html
<img src="图片URL" alt="描述" />
```

## 注意事项

1. **HTML 标签限制**：AO3 只支持特定的 HTML 标签，本模板使用的都是 AO3 支持的标签
2. **CSS 限制**：某些 CSS 属性可能被 AO3 过滤，如果样式不生效，可能需要调整
3. **段落格式**：AO3 会自动处理段落，确保每个段落都用 `<p>` 标签包裹
4. **测试建议**：建议先在测试作品中使用，确认样式正常后再发布正式作品

## 支持的 HTML 标签

根据 AO3 的文档，本模板使用的标签都在支持列表中：
- `div`, `span`, `p`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- `strong`, `em`, `u`, `i`, `b`
- `ul`, `li`, `ol`
- `blockquote`, `q`, `cite`
- `img`, `hr`
- `class` 属性（用于 CSS 选择器）

## 常见问题

**Q: 样式没有生效？**
A: 确保你选择了正确的 Work Skin，并且 CSS 代码已正确保存。

**Q: 某些样式不显示？**
A: AO3 可能会过滤某些 CSS 属性，尝试简化 CSS 或使用内联样式（如果支持）。

**Q: 如何修改背景色？**
A: 编辑 Work Skin 中的 `.forum-container` 的 `background` 属性。

**Q: 可以添加更多回复吗？**
A: 可以，复制回复的 HTML 结构并修改内容即可。


