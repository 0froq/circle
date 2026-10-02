# Agents

改 `data/people.json` 里某个人的条目时，提交说明统一用：

```
docs(people): update <字段> of <名字>
docs(people): add <字段> of <名字>
```

`update` 改已有内容，`add` 写入新内容。字段用数据里的名字，例如 `impression`、`aboutMe`、`timeline`。名字用这个人的 `name`。

这次提交如果改了 `data/people.json` 里某些人的 `impression`，在提交说明的正文里另起一行，把这些人的 `@handle` 用空格隔开写全，方便整段复制去发 X。只算画出来的文字变了的人。`""` 和 `[]` 都是空白，字符串和拆成同样几行的数组也算同一份内容，这类格式改动不要写进这行。
