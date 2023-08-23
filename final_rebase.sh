#!/bin/bash

# 最终rebase脚本 - 自动解决所有冲突

echo "开始最终rebase处理..."

export GIT_EDITOR=true

count=0
while true; do
    count=$((count + 1))
    echo "处理第 $count 个步骤..."
    
    # 检查是否有冲突
    if git status --porcelain | grep -q "^UU\|^AA\|^DD"; then
        echo "发现冲突，使用incoming内容解决..."
        git status --porcelain | grep "^UU\|^AA\|^DD" | awk '{print $2}' | xargs -I {} git checkout --theirs {}
        git add -A
        git rebase --continue
    else
        # 检查是否还在rebase中
        if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
            echo "继续rebase..."
            git add -A
            git rebase --continue
        else
            echo "rebase完成！"
            break
        fi
    fi
    
    # 防止无限循环
    if [ $count -gt 1000 ]; then
        echo "已处理1000个步骤，停止..."
        break
    fi
done

echo "rebase处理完成！"
echo "总共处理了 $count 个步骤"

# 验证结果
echo ""
echo "=== 最终结果 ==="
echo "当前提交历史（前10条）："
git log --oneline | head -10
echo ""
echo "总提交数："
git log --oneline | wc -l

echo ""
echo "Git历史重写完成！"
