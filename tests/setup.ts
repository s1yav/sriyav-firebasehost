import * as pulumi from "@pulumi/pulumi";

/**
 * Sets up standard Pulumi mocks for unit testing.
 */
export function setupMocks() {
    const mockImpl = {
        newResource: (args: pulumi.runtime.MockResourceArgs): { id: string, state: any } => {
            const state: any = { ...args.inputs };
            if (args.type === "gcp:serviceaccount/account:Account" && args.inputs.accountId) {
                state.email = `${args.inputs.accountId}@${args.inputs.project || "test-project"}.iam.gserviceaccount.com`;
            }
            return {
                id: args.name + "_id",
                state,
            };
        },
        call: (args: pulumi.runtime.MockCallArgs) => {
            return args.inputs;
        },
    };

    pulumi.runtime.setMocks(mockImpl);

    // Also set mocks on any nested/linked @pulumi/pulumi instance (e.g., inside gcp-constructs)
    try {
        const constructPulumiPath = require.resolve("@pulumi/pulumi", {
            paths: [require.resolve("gcp-constructs")],
        });
        const constructPulumi = require(constructPulumiPath);
        if (constructPulumi && constructPulumi !== pulumi) {
            constructPulumi.runtime.setMocks(mockImpl);
        }
    } catch {
        // Ignored if gcp-constructs does not have an independent @pulumi/pulumi instance
    }
}

/**
 * Helper to resolve the value of a Pulumi Output as a Promise.
 */
export function promiseOf<T>(output: pulumi.Output<T>): Promise<T> {
    return new Promise<T>((resolve) => {
        output.apply((val) => resolve(val));
    });
}
