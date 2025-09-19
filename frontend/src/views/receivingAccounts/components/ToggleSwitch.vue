<template>
  <div class="switchWrapper">
    <input 
      type="checkbox" 
      :id="id" 
      :checked="modelValue" 
      @change="$emit('update:modelValue', $event.target.checked)" 
    />
    <label :for="id" class="toggleSwitch"></label>
  </div>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    id: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue']
}
</script>

<style lang="scss" scoped>
.switchWrapper {
  position: relative;
  width: 60px;
  height: 30px;
  display: inline-block;
  
  input[type="checkbox"] {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
    
    &:checked + .toggleSwitch {
      background-color: #4CAF50;
      
      &:before {
        transform: translateX(30px);
      }
    }
  }
  
  .toggleSwitch {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
    
    &:before {
      position: absolute;
      content: "";
      height: 22px;
      width: 22px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
}
</style> 