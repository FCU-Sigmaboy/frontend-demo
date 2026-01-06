<template>
  <div v-if="show" class="image-cropper-modal" @click.self="handleCancel">
    <div class="cropper-container" @click.stop>
      <div class="cropper-header">
        <h3 class="cropper-title">{{ title }}</h3>
        <button class="close-btn" @click="handleCancel" aria-label="關閉">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="cropper-content">
        <div class="cropper-wrapper">
          <div class="cropper-canvas-container" ref="canvasContainer">
            <canvas ref="canvas" class="cropper-canvas"></canvas>
            <div
              ref="cropBox"
              class="crop-box"
              :style="cropBoxStyle"
              @mousedown="startDrag"
              @touchstart="startDrag"
            >
              <div class="crop-box-handles">
                <div
                  class="crop-handle crop-handle-nw"
                  @mousedown.stop="startResize('nw', $event)"
                  @touchstart.stop="startResize('nw', $event)"
                ></div>
                <div
                  class="crop-handle crop-handle-ne"
                  @mousedown.stop="startResize('ne', $event)"
                  @touchstart.stop="startResize('ne', $event)"
                ></div>
                <div
                  class="crop-handle crop-handle-sw"
                  @mousedown.stop="startResize('sw', $event)"
                  @touchstart.stop="startResize('sw', $event)"
                ></div>
                <div
                  class="crop-handle crop-handle-se"
                  @mousedown.stop="startResize('se', $event)"
                  @touchstart.stop="startResize('se', $event)"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="cropper-controls">
          <div class="control-group">
            <label class="control-label">縮放</label>
            <input
              type="range"
              v-model.number="zoom"
              min="0.5"
              max="3"
              step="0.1"
              class="zoom-slider"
              @input="updateZoom"
            />
            <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
          </div>
        </div>
      </div>

      <div class="cropper-actions">
        <button class="btn-cancel" @click="handleCancel">取消</button>
        <button class="btn-confirm" @click="handleConfirm">確認</button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

  const props = defineProps({
    show: {
      type: Boolean,
      default: false,
    },
    imageSrc: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '編輯大頭貼',
    },
    aspectRatioLocked: {
      type: Boolean,
      default: true, // 預設鎖定方形,適用於大頭貼
    },
  })

  const emit = defineEmits(['update:show', 'confirm', 'cancel'])

  const canvas = ref(null)
  const canvasContainer = ref(null)
  const cropBox = ref(null)

  const zoom = ref(1)
  const imageX = ref(0)
  const imageY = ref(0)
  const imageWidth = ref(0)
  const imageHeight = ref(0)
  const imageAspectRatio = ref(1)

  const cropBoxX = ref(0)
  const cropBoxY = ref(0)
  const cropBoxWidth = ref(200)
  const cropBoxHeight = ref(200)

  const isDragging = ref(false)
  const isResizing = ref(false)
  const resizeDirection = ref('')
  const dragStartX = ref(0)
  const dragStartY = ref(0)
  const dragStartCropX = ref(0)
  const dragStartCropY = ref(0)
  const dragStartCropWidth = ref(0)
  const dragStartCropHeight = ref(0)

  let ctx = null
  let img = null

  const cropBoxStyle = computed(() => {
    return {
      left: `${cropBoxX.value}px`,
      top: `${cropBoxY.value}px`,
      width: `${cropBoxWidth.value}px`,
      height: `${cropBoxHeight.value}px`,
    }
  })

  watch(
    () => props.show,
    (newVal) => {
      if (newVal && props.imageSrc) {
        nextTick(() => {
          loadImage()
        })
      }
    }
  )

  watch(
    () => props.imageSrc,
    (newVal) => {
      if (newVal && props.show) {
        nextTick(() => {
          loadImage()
        })
      }
    }
  )

  onMounted(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleTouchEnd)
  })

  const loadImage = () => {
    if (!canvas.value || !props.imageSrc) return

    ctx = canvas.value.getContext('2d')
    img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      imageAspectRatio.value = img.width / img.height

      const containerWidth = canvasContainer.value.clientWidth
      const containerHeight = Math.min(containerWidth, window.innerHeight * 0.5)

      // Set canvas size
      canvas.value.width = containerWidth
      canvas.value.height = containerHeight

      // Calculate initial image size to fit container
      let displayWidth = containerWidth - 40
      let displayHeight = displayWidth / imageAspectRatio.value

      if (displayHeight > containerHeight - 40) {
        displayHeight = containerHeight - 40
        displayWidth = displayHeight * imageAspectRatio.value
      }

      imageWidth.value = displayWidth
      imageHeight.value = displayHeight
      imageX.value = (containerWidth - displayWidth) / 2
      imageY.value = (containerHeight - displayHeight) / 2

      // Initialize crop box
      if (props.aspectRatioLocked) {
        // Square crop box for locked aspect ratio
        const size = Math.min(displayWidth, displayHeight) * 0.8
        cropBoxWidth.value = size
        cropBoxHeight.value = size
      } else {
        // Free aspect ratio
        cropBoxWidth.value = displayWidth * 0.8
        cropBoxHeight.value = displayHeight * 0.8
      }
      cropBoxX.value = imageX.value + (imageWidth.value - cropBoxWidth.value) / 2
      cropBoxY.value = imageY.value + (imageHeight.value - cropBoxHeight.value) / 2

      drawImage()
    }

    img.src = props.imageSrc
  }

  const drawImage = () => {
    if (!ctx || !img) return

    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

    // Draw dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)

    // Draw image
    const scaledWidth = imageWidth.value * zoom.value
    const scaledHeight = imageHeight.value * zoom.value
    const scaledX = imageX.value - (scaledWidth - imageWidth.value) / 2
    const scaledY = imageY.value - (scaledHeight - imageHeight.value) / 2

    ctx.save()
    ctx.beginPath()
    ctx.rect(cropBoxX.value, cropBoxY.value, cropBoxWidth.value, cropBoxHeight.value)
    ctx.clip()
    ctx.drawImage(img, scaledX, scaledY, scaledWidth, scaledHeight)
    ctx.restore()

    // Draw crop box border
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.strokeRect(cropBoxX.value, cropBoxY.value, cropBoxWidth.value, cropBoxHeight.value)
  }

  const updateZoom = () => {
    drawImage()
  }

  const startDrag = (e) => {
    e.preventDefault()
    isDragging.value = true
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    dragStartX.value = clientX
    dragStartY.value = clientY
    dragStartCropX.value = cropBoxX.value
    dragStartCropY.value = cropBoxY.value
  }

  const startResize = (direction, e) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.value = true
    resizeDirection.value = direction
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    dragStartX.value = clientX
    dragStartY.value = clientY
    dragStartCropX.value = cropBoxX.value
    dragStartCropY.value = cropBoxY.value
    dragStartCropWidth.value = cropBoxWidth.value
    dragStartCropHeight.value = cropBoxHeight.value
  }

  const handleMouseMove = (e) => {
    if (!isDragging.value && !isResizing.value) return

    const clientX = e.clientX
    const clientY = e.clientY
    handleMove(clientX, clientY)
  }

  const handleTouchMove = (e) => {
    if (!isDragging.value && !isResizing.value) return
    e.preventDefault()

    const clientX = e.touches[0].clientX
    const clientY = e.touches[0].clientY
    handleMove(clientX, clientY)
  }

  const handleMove = (clientX, clientY) => {
    const rect = canvasContainer.value.getBoundingClientRect()
    const deltaX = clientX - dragStartX.value
    const deltaY = clientY - dragStartY.value

    if (isDragging.value) {
      // Move crop box
      let newX = dragStartCropX.value + deltaX
      let newY = dragStartCropY.value + deltaY

      // Constrain to canvas bounds
      newX = Math.max(0, Math.min(newX, canvas.value.width - cropBoxWidth.value))
      newY = Math.max(0, Math.min(newY, canvas.value.height - cropBoxHeight.value))

      cropBoxX.value = newX
      cropBoxY.value = newY
    } else if (isResizing.value) {
      // Resize crop box
      const minSize = 100
      let newWidth = dragStartCropWidth.value
      let newHeight = dragStartCropHeight.value
      let newX = dragStartCropX.value
      let newY = dragStartCropY.value

      if (props.aspectRatioLocked) {
        // Locked aspect ratio (square)
        const maxSize = Math.min(canvas.value.width, canvas.value.height)
        const startSize = Math.min(dragStartCropWidth.value, dragStartCropHeight.value)
        let newSize = startSize

        // Calculate size change based on direction
        if (resizeDirection.value === 'se') {
          const delta = Math.max(deltaX, deltaY)
          newSize = startSize + delta
        } else if (resizeDirection.value === 'nw') {
          const delta = Math.min(deltaX, deltaY)
          newSize = startSize - delta
          newX = dragStartCropX.value + delta
          newY = dragStartCropY.value + delta
        } else if (resizeDirection.value === 'ne') {
          const delta = Math.max(deltaX, -deltaY)
          newSize = startSize + delta
          newY = dragStartCropY.value - delta
        } else if (resizeDirection.value === 'sw') {
          const delta = Math.max(-deltaX, deltaY)
          newSize = startSize + delta
          newX = dragStartCropX.value - delta
        }

        newSize = Math.max(minSize, Math.min(maxSize, newSize))
        newX = Math.max(0, Math.min(newX, canvas.value.width - newSize))
        newY = Math.max(0, Math.min(newY, canvas.value.height - newSize))

        newWidth = newSize
        newHeight = newSize
      } else {
        // Free aspect ratio
        if (resizeDirection.value === 'se') {
          newWidth = dragStartCropWidth.value + deltaX
          newHeight = dragStartCropHeight.value + deltaY
        } else if (resizeDirection.value === 'nw') {
          newWidth = dragStartCropWidth.value - deltaX
          newHeight = dragStartCropHeight.value - deltaY
          newX = dragStartCropX.value + deltaX
          newY = dragStartCropY.value + deltaY
        } else if (resizeDirection.value === 'ne') {
          newWidth = dragStartCropWidth.value + deltaX
          newHeight = dragStartCropHeight.value - deltaY
          newY = dragStartCropY.value + deltaY
        } else if (resizeDirection.value === 'sw') {
          newWidth = dragStartCropWidth.value - deltaX
          newHeight = dragStartCropHeight.value + deltaY
          newX = dragStartCropX.value + deltaX
        }

        // Constrain size
        newWidth = Math.max(minSize, Math.min(canvas.value.width, newWidth))
        newHeight = Math.max(minSize, Math.min(canvas.value.height, newHeight))

        // Constrain position
        newX = Math.max(0, Math.min(newX, canvas.value.width - newWidth))
        newY = Math.max(0, Math.min(newY, canvas.value.height - newHeight))
      }

      cropBoxWidth.value = newWidth
      cropBoxHeight.value = newHeight
      cropBoxX.value = newX
      cropBoxY.value = newY
    }

    drawImage()
  }

  const handleMouseUp = () => {
    isDragging.value = false
    isResizing.value = false
    resizeDirection.value = ''
  }

  const handleTouchEnd = () => {
    isDragging.value = false
    isResizing.value = false
    resizeDirection.value = ''
  }

  const getCroppedImage = () => {
    if (!canvas.value || !img) return null

    // Calculate source coordinates
    const scale = zoom.value
    const scaledWidth = imageWidth.value * scale
    const scaledHeight = imageHeight.value * scale
    const scaledX = imageX.value - (scaledWidth - imageWidth.value) / 2
    const scaledY = imageY.value - (scaledHeight - imageHeight.value) / 2

    // Calculate crop area relative to image
    const cropRelativeX = (cropBoxX.value - scaledX) / scaledWidth
    const cropRelativeY = (cropBoxY.value - scaledY) / scaledHeight
    const cropRelativeWidth = cropBoxWidth.value / scaledWidth
    const cropRelativeHeight = cropBoxHeight.value / scaledHeight

    // Source coordinates in original image
    const srcX = cropRelativeX * img.width
    const srcY = cropRelativeY * img.height
    const srcWidth = cropRelativeWidth * img.width
    const srcHeight = cropRelativeHeight * img.height

    // Output dimensions
    let outputWidth, outputHeight
    if (props.aspectRatioLocked) {
      // Square output for profile picture
      outputWidth = 400
      outputHeight = 400
    } else {
      // Maintain aspect ratio, max dimension 1200px
      const maxDimension = 1200
      const aspectRatio = srcWidth / srcHeight
      if (aspectRatio > 1) {
        outputWidth = Math.min(srcWidth, maxDimension)
        outputHeight = outputWidth / aspectRatio
      } else {
        outputHeight = Math.min(srcHeight, maxDimension)
        outputWidth = outputHeight * aspectRatio
      }
    }

    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = outputWidth
    outputCanvas.height = outputHeight
    const outputCtx = outputCanvas.getContext('2d')

    // Draw cropped image
    outputCtx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, outputWidth, outputHeight)

    return new Promise((resolve) => {
      outputCanvas.toBlob(
        (blob) => {
          resolve(blob)
        },
        'image/webp',
        0.9
      )
    })
  }

  const handleConfirm = async () => {
    const croppedBlob = await getCroppedImage()
    if (croppedBlob) {
      emit('confirm', croppedBlob)
      handleCancel()
    }
  }

  const handleCancel = () => {
    emit('update:show', false)
    emit('cancel')
  }
</script>

<style scoped lang="scss">
  @import '@/styles/variables';

  .image-cropper-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  }

  .cropper-container {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .cropper-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #e0e0e0;

    .cropper-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      color: #666;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        background: #f5f5f5;
        color: #1e1e1e;
      }
    }
  }

  .cropper-content {
    padding: 24px;
    overflow: auto;
  }

  .cropper-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }

  .cropper-canvas-container {
    position: relative;
    width: 100%;
    max-width: 500px;
    background: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;
  }

  .cropper-canvas {
    display: block;
    width: 100%;
    height: auto;
    max-height: 500px;
  }

  .crop-box {
    position: absolute;
    border: 2px solid #fff;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    cursor: move;
    touch-action: none;
  }

  .crop-box-handles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .crop-handle {
    position: absolute;
    width: 12px;
    height: 12px;
    background: #fff;
    border: 2px solid $primary;
    border-radius: 2px;
    cursor: pointer;

    &.crop-handle-nw {
      top: -6px;
      left: -6px;
      cursor: nw-resize;
    }

    &.crop-handle-ne {
      top: -6px;
      right: -6px;
      cursor: ne-resize;
    }

    &.crop-handle-sw {
      bottom: -6px;
      left: -6px;
      cursor: sw-resize;
    }

    &.crop-handle-se {
      bottom: -6px;
      right: -6px;
      cursor: se-resize;
    }

    &:hover {
      background: $primary;
      transform: scale(1.2);
    }
  }

  .cropper-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .control-label {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #1e1e1e;
    min-width: 50px;
  }

  .zoom-slider {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: #e0e0e0;
    outline: none;
    -webkit-appearance: none;
    appearance: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: $primary;
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: $primary;
      cursor: pointer;
      border: none;
    }
  }

  .zoom-value {
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 14px;
    color: #666;
    min-width: 45px;
    text-align: right;
  }

  .cropper-actions {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #e0e0e0;
    justify-content: flex-end;
  }

  .btn-cancel,
  .btn-confirm {
    padding: 10px 24px;
    font-family: 'Noto Sans TC', sans-serif;
    font-size: 15px;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
  }

  .btn-cancel {
    background: white;
    color: #666;
    border: 1px solid #d0d0d0;

    &:hover {
      background: #f5f5f5;
      border-color: #b0b0b0;
    }
  }

  .btn-confirm {
    background: $primary;
    color: white;

    &:hover {
      background: #5fa795;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(111, 184, 165, 0.3);
    }
  }

  @media (max-width: 767.98px) {
    .image-cropper-modal {
      padding: 10px;
    }

    .cropper-container {
      max-height: 95vh;
    }

    .cropper-header {
      padding: 16px 20px;

      .cropper-title {
        font-size: 18px;
      }
    }

    .cropper-content {
      padding: 20px;
    }

    .cropper-canvas-container {
      max-width: 100%;
    }

    .cropper-actions {
      flex-direction: column-reverse;
      padding: 16px 20px;

      .btn-cancel,
      .btn-confirm {
        width: 100%;
      }
    }
  }
</style>
