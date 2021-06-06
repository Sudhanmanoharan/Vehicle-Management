# Local Network Caliper For Fabric Benchmark

## Install Caliper CLI

``` js
npm install -g --only=prod @hyperledger/caliper-cli@0.4.0
```

## Install Fabric

``` js
npx caliper bind \
    --caliper-bind-sut fabric:2.1.0 \
    --caliper-bind-args=-g
```

## Lanching Caliper Manager  

``` js
npx caliper launch manager \
        --caliper-workspace . \
        --caliper-fabric-gateway-enabled \
        --caliper-benchconfig benchmarks/scenario/simple/fabric-v2.2/config.yaml \
        --caliper-networkconfig networks/fabric/v2.2/network-config.yaml
```

<!-- This site was built using [GitHub Pages](https://pages.github.com/) -->

---

<!-- # Containerising Caliper Fabric Benchmark -->
