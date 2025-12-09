<template>
    <div class="library-image-container">
        <!-- Placeholder with shimmer while loading -->
        <div class="library-placeholder-wrapper" v-if="isLoading && doSrc">
            <div class="library-placeholder-bg" :class="bgp"></div>
            <div class="library-shimmer"></div>
            <!-- Hidden image for preloading -->
            <img :src="doSrc" @load="onLoadSuccess()" @error="onLoadError()" style="position: absolute; visibility: hidden; width: 0; height: 0;">
        </div>
        
        <!-- No URL provided: show placeholder immediately -->
        <div class="library-placeholder-wrapper" v-else-if="doSrc == null">
            <div class="library-placeholder-bg" :class="bgp"></div>
        </div>
        
        <!-- Image loaded successfully -->
        <img 
            v-else-if="!isLoading && !isError"
            :src="doSrc" 
            :alt="altText"
            class="library-image"
        />
        
        <!-- Image failed to load: show placeholder as fallback -->
        <div class="library-placeholder-wrapper" v-else>
            <div class="library-placeholder-bg" :class="bgp"></div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ErrorAwareLibraryImage',
    data() {
        return {
            isError: false,
            isLoading: true
        };
    },
    props: {
        doSrc: {
            type: String,
            default: null
        },
        altText: {
            type: String,
            default: 'Library image'
        },
        width: {
            type: Number,
            default: 342
        },
        height: {
            type: Number,
            default: 190
        }
    },
    computed: {
        computedWidth() {
            return this.width;
        },
        computedHeight() {
            return this.height;
        },
        bgp() {
            // Random gradient pattern (reusing the same patterns from ErrorAwareImage)
            return `bgp-${Math.round(Math.random() * 18) + 1}`;
        }
    },
    watch: {
        doSrc() {
            this.isError = false;
            this.isLoading = true;
        }
    },
    methods: {
        onLoadSuccess() {
            this.isLoading = false;
            this.isError = false;
        },
        onLoadError() {
            this.isLoading = false;
            this.isError = true;
        }
    }
};
</script>

<style scoped>
.library-image-container {
    position: relative;
    width: v-bind('computedWidth + "px"');
    height: v-bind('computedHeight + "px"');
    display: flex;
    align-items: center;
    justify-content: center;
}

.library-placeholder-wrapper {
    position: relative;
    width: v-bind('computedWidth + "px"');
    height: v-bind('computedHeight + "px"');
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.library-placeholder-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0.5;
}

.library-shimmer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.3) 50%,
        rgba(255, 255, 255, 0) 100%
    );
    animation: shimmer 2s infinite;
    z-index: 1;
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

.library-image {
    width: v-bind('computedWidth + "px"');
    height: v-bind('computedHeight + "px"');
    object-fit: cover;
}

/* Background patterns - reusing from ErrorAwareImage */
/* Temani Afif */
.bgp-1 {
    --s: 120px;
    --_g: radial-gradient(#0000 70%, #1a2030 71%);
    background: var(--_g), var(--_g) calc(var(--s) / 2) calc(var(--s) / 2), conic-gradient(#0f9177 25%, #fdebad 0 50%, #d34434 0 75%, #b5d999 0);
    background-size: var(--s) var(--s);
}

.bgp-2 {
    --sz: 10px;
    --c0: #3a1b0f;
    --c1: #ffc56f;
    --c2: #d99838;
    --c3: #9b5e05;
    --ts: 50% / calc(var(--sz) * 12.8) calc(var(--sz) * 22);
    background:
        conic-gradient(from 120deg at 50% 86.5%, var(--c1) 0 120deg, #fff0 0 360deg) var(--ts),
        conic-gradient(from 120deg at 50% 86.5%, var(--c1) 0 120deg, #fff0 0 360deg) var(--ts),
        conic-gradient(from 120deg at 50% 74%, var(--c0) 0 120deg, #fff0 0 360deg) var(--ts),
        conic-gradient(from 60deg at 60% 50%, var(--c1) 0 60deg, var(--c2) 0 120deg, #fff0 0 360deg) var(--ts),
        conic-gradient(from 180deg at 40% 50%, var(--c3) 0 60deg, var(--c1) 0 120deg, #fff0 0 360deg) var(--ts),
        conic-gradient(from 0deg at 90% 35%, var(--c0) 0 90deg, #fff0 0 360deg) var(--ts),
        conic-gradient(from -90deg at 10% 35%, var(--c0) 0 90deg, #fff0 0 360deg) var(--ts),
        conic-gradient(from 0deg at 90% 35%, var(--c0) 0 90deg, #fff0 0 360deg) var(--ts),
        conic-gradient(from -90deg at 10% 35%, var(--c0) 0 90deg, #fff0 0 360deg) var(--ts),
        conic-gradient(from -60deg at 50% 13.5%, var(--c1) 0 120deg, #fff0 0 360deg) var(--ts),
        conic-gradient(from -60deg at 50% 13.5%, var(--c1) 0 120deg, #fff0 0 360deg) var(--ts),
        conic-gradient(from -60deg at 50% 41%, var(--c2) 0 60deg, var(--c3) 0 120deg, #fff0 0 360deg) var(--ts), var(--c0);
}

.bgp-3 {
    --s: 120px;
    --c1: #4e395d;
    --c2: #8ebe94;
    --_g: var(--c1) 15%, var(--c2) 0 28%, #0000 0 72%, var(--c2) 0 85%, var(--c1) 0;
    background: conic-gradient(from 90deg at 2px 2px, #0000 25%, var(--c1) 0) -1px -1px, linear-gradient(-45deg, var(--_g)), linear-gradient(45deg, var(--_g)),
        conic-gradient(from 90deg at 40% 40%, var(--c1) 25%, var(--c2) 0) calc(var(--s) / -5) calc(var(--s) / -5);
    background-size: var(--s) var(--s);
}

.bgp-4 {
    --s: 150px;
    background: linear-gradient(135deg, #0000 18.75%, #5e412f 0 31.25%, #0000 0), repeating-linear-gradient(45deg, #5e412f -6.25% 6.25%, #fcebb6 0 18.75%);
    background-size: var(--s) var(--s);
}

.bgp-5 {
    --r: 56px;
    --c1: #3fb8af 99%, #0000 101%;
    --c2: #ff9e9d 99%, #0000 101%;
    --s: calc(var(--r) * 0.866);
    --g0: radial-gradient(var(--r), var(--c1));
    --g1: radial-gradient(var(--r), var(--c2));
    --f: radial-gradient(var(--r) at calc(100% + var(--s)) 50%, var(--c1));
    --p: radial-gradient(var(--r) at 100% 50%, var(--c2));
    background: var(--f) 0 calc(-5 * var(--r) / 2), var(--f) calc(-2 * var(--s)) calc(var(--r) / 2), var(--p) 0 calc(-2 * var(--r)),
        var(--g0) var(--s) calc(-5 * var(--r) / 2), var(--g1) var(--s) calc(5 * var(--r) / 2),
        radial-gradient(var(--r) at 100% 100%, var(--c1)) 0 calc(-1 * var(--r)), radial-gradient(var(--r) at 0% 50%, var(--c1)) 0 calc(-4 * var(--r)),
        var(--g1) calc(-1 * var(--s)) calc(-7 * var(--r) / 2), var(--g0) calc(-1 * var(--s)) calc(-5 * var(--r) / 2), var(--p) calc(-2 * var(--s)) var(--r),
        var(--g0) calc(-1 * var(--s)) calc(var(--r) / 2), var(--g1) calc(-1 * var(--s)) calc(var(--r) / -2), var(--g0) 0 calc(-1 * var(--r)),
        var(--g1) var(--s) calc(var(--r) / -2), var(--g0) var(--s) calc(var(--r) / 2) #ff9e9d;
    background-size: calc(4 * var(--s)) calc(6 * var(--r));
}

.bgp-6 {
    background: 60px 60px/120px 120px linear-gradient(135deg, #d4bade 10%, #a054c0 0 25%, transparent 0 75%, #a054c0 0 90%, #d4bade 90%),
        0 0/120px 120px linear-gradient(135deg, #d4bade 10%, #c093d2 0 25%, transparent 0 75%, #c093d2 0 90%, #d4bade 90%),
        0 0/120px 120px linear-gradient(45deg, #d4bade 10%, #a054c0 0 25%, #c093d2 0 40%, #d4bade 0 60%, #c093d2 0 75%, #a054c0 0 90%, #d4bade 90%);
}

.bgp-7 {
    --s: 80px;
    --c: #542437;
    --_g: #0000 calc(-650% / 13) calc(50% / 13), var(--c) 0 calc(100% / 13), #0000 0 calc(150% / 13), var(--c) 0 calc(200% / 13), #0000 0 calc(250% / 13),
        var(--c) 0 calc(300% / 13);
    --_g0: repeating-linear-gradient(45deg, var(--_g));
    --_g1: repeating-linear-gradient(-45deg, var(--_g));
    background: var(--_g0), var(--_g0) var(--s) var(--s), var(--_g1), var(--_g1) var(--s) var(--s) #c02942;
    background-size: calc(2 * var(--s)) calc(2 * var(--s));
}

.bgp-8 {
    --s: 55px;
    --b: 15px;
    --_r: calc(1.28 * var(--s) + var(--b) / 2) at top 50%;
    --_f: calc(99.5% - var(--b)), #f9f2e7 calc(101% - var(--b)) 99.5%, #0000 101%;
    --_g0: calc(-0.8 * var(--s)), #88a65e var(--_f);
    --_g1: calc(-0.8 * var(--s)), #bfb35a var(--_f);
    --_s: calc(1.8 * var(--s) + var(--b));
    background: radial-gradient(var(--_r) right var(--_g0)) calc(-1 * var(--_s)) var(--s),
        radial-gradient(var(--_r) left var(--_g1)) var(--_s) calc(-1 * var(--s)),
        radial-gradient(var(--_r) right var(--_g1)) calc(var(--_s) / -2) calc(-1 * var(--s)),
        radial-gradient(var(--_r) left var(--_g0)) calc(var(--_s) / 2) var(--s), linear-gradient(90deg, #88a65e 50%, #bfb35a 0);
    background-size: var(--_s) calc(4 * var(--s));
}

.bgp-9 {
    --s: 70px;
    --c: #6b5344;
    --_l: #0000 46%, var(--c) 47% 53%, #0000 54%;
    background: radial-gradient(100% 100% at 100% 100%, var(--_l)) var(--s) var(--s), radial-gradient(100% 100% at 0 0, var(--_l)) var(--s) var(--s),
        radial-gradient(100% 100%, #0000 22%, var(--c) 23% 29%, #0000 30% 34%, var(--c) 35% 41%, #0000 42%) #f8ecc9;
    background-size: calc(var(--s) * 2) calc(var(--s) * 2);
}

.bgp-10 {
    --s: 100px;
    --c1: #f8b195;
    --c2: #355c7d;
    --_g: var(--c2) 6% 14%, var(--c1) 16% 24%, var(--c2) 26% 34%, var(--c1) 36% 44%, var(--c2) 46% 54%, var(--c1) 56% 64%, var(--c2) 66% 74%, var(--c1) 76% 84%,
        var(--c2) 86% 94%;
    background: radial-gradient(100% 100% at 100% 0, var(--c1) 4%, var(--_g), #0008 96%, #0000),
        radial-gradient(100% 100% at 0 100%, #0000, #0008 4%, var(--_g), var(--c1) 96%) var(--c1);
    background-size: var(--s) var(--s);
}

.bgp-11 {
    --s: 80px;
    --_g: radial-gradient(#4d4d4d 45%, #0000 46%);
    --_l: radial-gradient(#ffffff 15%, #0000 16%);
    background: var(--_l), var(--_l), var(--_g), var(--_g);
    background-position: 0 0, var(--s) var(--s);
    background-size: calc(2 * var(--s)) calc(2 * var(--s));
}

.bgp-12 {
    --s: 100px;
    --_g: #fcd036 0 100%, #0000 102%;
    background: conic-gradient(#0000 75%, var(--_g)) calc(var(--s) / 4) calc(var(--s) / 4), radial-gradient(65% 65% at 50% -50%, var(--_g)),
        radial-gradient(65% 65% at -50% 50%, var(--_g)), radial-gradient(65% 65% at 50% 150%, var(--_g)),
        radial-gradient(65% 65% at 150% 50%, var(--_g)) #987f69;
    background-size: var(--s) var(--s);
}

.bgp-13 {
    --s: 100px;
    --c1: #668284;
    --c2: #b6d8c0;
    --c3: #b9d7d9;
    --_g: #0000, var(--c1) 1deg 30deg, var(--c2) 31deg 89deg, var(--c1) 90deg 119deg, #0000 120deg;
    background: conic-gradient(from -60deg at 50% 28.86%, var(--_g)), conic-gradient(from 30deg at 71.14% 50%, var(--_g)),
        conic-gradient(from 120deg at 50% 71.14%, var(--_g)), conic-gradient(from 210deg at 28.86% 50%, var(--_g)) var(--c3);
    background-size: var(--s) var(--s);
}

.bgp-14 {
    --s: 150px;
    --_g: #0000 90deg, #046d8b 0;
    background: conic-gradient(from 116.56deg at calc(100% / 3) 0, var(--_g)), conic-gradient(from -63.44deg at calc(200% / 3) 100%, var(--_g)) #2fb8ac;
    background-size: var(--s) var(--s);
}

.bgp-15 {
    --s: 60px;
    --_g: #0000 83%, #b09f79 85% 99%, #0000 101%;
    background: radial-gradient(27% 29% at right, var(--_g)) calc(var(--s) / 2) var(--s),
        radial-gradient(27% 29% at left, var(--_g)) calc(var(--s) / -2) var(--s), radial-gradient(29% 27% at top, var(--_g)) 0 calc(var(--s) / 2),
        radial-gradient(29% 27% at bottom, var(--_g)) 0 calc(var(--s) / -2) #476074;
    background-size: calc(2 * var(--s)) calc(2 * var(--s));
}

.bgp-16 {
    --s: 30px;
    --_c: #5e9fa3;
    background: conic-gradient(at 50% calc(100% / 6), var(--_c) 60deg, #0000 0), conic-gradient(at calc(100% / 6) 50%, #0000 240deg, var(--_c) 0),
        conic-gradient(from 180deg at calc(100% / 6) calc(500% / 6), var(--_c) 60deg, #0000 0),
        conic-gradient(from 180deg at calc(500% / 6), #0000 240deg, var(--_c) 0) calc(4 * 0.866 * var(--s)) 0,
        repeating-linear-gradient(-150deg, #b05574 0 calc(100% / 6), #0000 0 50%), repeating-linear-gradient(-30deg, #b39c82 0 calc(100% / 6), #dcd1b4 0 50%);
    background-size: calc(6 * 0.866 * var(--s)) calc(3 * var(--s));
}

.bgp-17 {
    --s: 100px;
    --c1: #c3ccaf;
    --c2: #67434f;
    --_s: calc(2 * var(--s)) calc(2 * var(--s));
    --_g: var(--_s) conic-gradient(at 40% 40%, #0000 75%, var(--c1) 0);
    --_p: var(--_s) conic-gradient(at 20% 20%, #0000 75%, var(--c2) 0);
    background: calc(0.9 * var(--s)) calc(0.9 * var(--s)) / var(--_p), calc(-0.1 * var(--s)) calc(-0.1 * var(--s)) / var(--_p),
        calc(0.7 * var(--s)) calc(0.7 * var(--s)) / var(--_g), calc(-0.3 * var(--s)) calc(-0.3 * var(--s)) / var(--_g),
        conic-gradient(from 90deg at 20% 20%, var(--c2) 25%, var(--c1) 0) 0 0 / var(--s) var(--s);
}

.bgp-18 {
    --s: 82px;
    --c1: #b2b2b2;
    --c2: #ffffff;
    --c3: #d9d9d9;
    --_g: var(--c3) 0 120deg, #0000 0;
    background: conic-gradient(from -60deg at 50% calc(100% / 3), var(--_g)), conic-gradient(from 120deg at 50% calc(200% / 3), var(--_g)),
        conic-gradient(from 60deg at calc(200% / 3), var(--c3) 60deg, var(--c2) 0 120deg, #0000 0),
        conic-gradient(from 180deg at calc(100% / 3), var(--c1) 60deg, var(--_g)),
        linear-gradient(90deg, var(--c1) calc(100% / 6), var(--c2) 0 50%, var(--c1) 0 calc(500% / 6), var(--c2) 0);
    background-size: calc(1.732 * var(--s)) var(--s);
}

.bgp-19 {
    --s: 40px;
    --_c: #0000 75%, #c0d860 0;
    --_g1: conic-gradient(at 10% 50%, var(--_c));
    --_g2: conic-gradient(at 50% 10%, var(--_c));
    background: var(--_g1), var(--_g1) calc(1 * var(--s)) calc(3 * var(--s)), var(--_g1) calc(2 * var(--s)) calc(1 * var(--s)),
        var(--_g1) calc(3 * var(--s)) calc(4 * var(--s)), var(--_g1) calc(4 * var(--s)) calc(2 * var(--s)), var(--_g2) 0 calc(4 * var(--s)),
        var(--_g2) calc(1 * var(--s)) calc(2 * var(--s)), var(--_g2) calc(2 * var(--s)) 0, var(--_g2) calc(3 * var(--s)) calc(3 * var(--s)),
        var(--_g2) calc(4 * var(--s)) calc(1 * var(--s)), #604848;
    background-size: calc(5 * var(--s)) calc(5 * var(--s));
}
</style>
