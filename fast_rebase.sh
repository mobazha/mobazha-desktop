#!/bin/bash

# 快速rebase脚本，自动处理所有冲突

echo "开始快速rebase，自动处理所有冲突..."

# 设置环境变量避免编辑器问题
export GIT_EDITOR=true

while true; do
    # 检查rebase状态
    if git status --porcelain | grep -q "^UU\|^AA\|^DD"; then
        echo "发现冲突，使用incoming内容解决..."
        
        # 使用incoming内容解决所有冲突
        git status --porcelain | grep "^UU\|^AA\|^DD" | awk '{print $2}' | xargs -I {} git checkout --theirs {}
        
        # 添加所有解决的文件
        git add -A
        
        # 继续rebase
        git rebase --continue
    else
        # 检查是否还在rebase中
        if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
            echo "继续rebase..."
            git rebase --continue
        else
            echo "rebase完成！"
            break
        fi
    fi
done

echo "所有冲突已解决，rebase完成！"
