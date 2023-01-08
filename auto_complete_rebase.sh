#!/bin/bash

# 自动完成rebase的脚本
# 自动解决所有冲突，使用incoming内容

echo "开始自动完成rebase，使用incoming内容解决所有冲突..."

# 设置环境变量避免编辑器问题
export GIT_EDITOR=true

count=0
while true; do
    count=$((count + 1))
    echo "处理第 $count 个冲突..."
    
    # 检查是否有冲突
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
            echo "没有冲突，继续rebase..."
            git rebase --continue
        else
            echo "rebase完成！"
            break
        fi
    fi
    
    # 防止无限循环
    if [ $count -gt 1000 ]; then
        echo "已处理1000个冲突，可能有问题，停止..."
        break
    fi
done

echo "所有冲突已解决，rebase完成！"
echo "总共处理了 $count 个步骤"
